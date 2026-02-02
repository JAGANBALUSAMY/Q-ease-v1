const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendTokenIssuedEmail, sendTokenCalledEmail, sendTokenReminderEmail } = require('./emailService');

// Note: Firebase Admin SDK is optional for push notifications
// Initialize only if credentials are provided
let firebaseInitialized = false;
let admin = null;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.warn('⚠️  Firebase not initialized:', error.message);
  }
} else {
  console.log('ℹ️  Firebase credentials not provided - push notifications disabled');
}

// Send token created notification
const sendTokenCreatedNotification = async (token, user) => {
  try {
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: token.userId },
        include: { roleModel: true }
      });
    }

    if (!user || user.roleModel?.name !== 'USER') {
      console.log(`ℹ️ Skipping notification for non-customer user ${user?.email || 'unknown'}`);
      return;
    }

    const queue = await prisma.queue.findUnique({
      where: { id: token.queueId },
      select: { name: true, averageTime: true }
    });

    const estimatedWait = Math.round((token.position || 1) * (queue?.averageTime || 10));
    const notificationTitle = 'Token Created';
    const notificationBody = `Your token ${token.tokenId} has been created for ${queue?.name}. Position: ${token.position}. Estimated wait: ${estimatedWait} mins.`;

    // Send push notification if Firebase is initialized and user has device token
    if (firebaseInitialized && user.deviceToken) {
      try {
        await admin.messaging().send({
          token: user.deviceToken,
          notification: {
            title: notificationTitle,
            body: notificationBody
          },
          data: {
            tokenId: token.id,
            queueId: token.queueId,
            action: 'token_created'
          }
        });
        console.log(`📱 Push notification sent to ${user.email}`);
      } catch (pushError) {
        console.error('Push notification failed:', pushError.message);
      }
    }

    // Create notification record in database
    await prisma.notification.create({
      data: {
        userId: user.id,
        organisationId: token.organisationId,
        title: notificationTitle,
        message: notificationBody,
        type: 'TOKEN_ISSUED',
        data: JSON.stringify({
          tokenId: token.id,
          tokenNumber: token.tokenId,
          queueId: token.queueId,
          position: token.position
        })
      }
    });

    // Send email notification
    const organisation = await prisma.organisation.findUnique({
      where: { id: token.organisationId },
      select: { name: true, address: true }
    });

    if (organisation) {
      sendTokenIssuedEmail(user, token, queue, organisation).catch(err =>
        console.error('Email notification error:', err)
      );
    }

    console.log(`✅ Token created notification saved for user ${user.email}`);
  } catch (error) {
    console.error('Error sending token created notification:', error);
  }
};

// Send token called notification
const sendTokenCalledNotification = async (token, user) => {
  try {
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: token.userId },
        include: { roleModel: true }
      });
    }

    if (!user || user.roleModel?.name !== 'USER') {
      console.log(`ℹ️ Skipping notification for non-customer user ${user?.email || 'unknown'}`);
      return;
    }

    const notificationTitle = 'Your Token is Called!';
    const notificationBody = `Token ${token.tokenId} is called! Please proceed to the service counter immediately.`;

    // Send high-priority push notification
    if (firebaseInitialized && user.deviceToken) {
      try {
        await admin.messaging().send({
          token: user.deviceToken,
          notification: {
            title: notificationTitle,
            body: notificationBody
          },
          data: {
            tokenId: token.id,
            queueId: token.queueId,
            action: 'token_called'
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'high_priority',
              sound: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                badge: 1,
                sound: 'default',
                category: 'IMMEDIATE_SERVICE'
              }
            }
          }
        });
        console.log(`📱 High-priority push notification sent to ${user.email}`);
      } catch (pushError) {
        console.error('Push notification failed:', pushError.message);
      }
    }

    // Create notification record
    await prisma.notification.create({
      data: {
        userId: user.id,
        organisationId: token.organisationId,
        title: notificationTitle,
        message: notificationBody,
        type: 'TOKEN_CALLED',
        data: JSON.stringify({
          tokenId: token.id,
          tokenNumber: token.tokenId,
          queueId: token.queueId
        })
      }
    });

    // Send email notification
    const queue = await prisma.queue.findUnique({
      where: { id: token.queueId },
      select: { name: true, averageTime: true }
    });

    const organisation = await prisma.organisation.findUnique({
      where: { id: token.organisationId },
      select: { name: true, address: true }
    });

    if (queue && organisation) {
      sendTokenCalledEmail(user, token, queue, organisation).catch(err =>
        console.error('Email notification error:', err)
      );
    }

    console.log(`✅ Token called notification saved for user ${user.email}`);
  } catch (error) {
    console.error('Error sending token called notification:', error);
  }
};

// Send token nearing service notification
const sendTokenNearingServiceNotification = async (token, user) => {
  try {
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: token.userId },
        include: { roleModel: true }
      });
    }

    if (!user || user.roleModel?.name !== 'USER') return;

    const notificationTitle = 'Your Token is Approaching';
    const notificationBody = `Token ${token.tokenId} is nearly up! Please proceed to the service counter.`;

    if (firebaseInitialized && user.deviceToken) {
      try {
        await admin.messaging().send({
          token: user.deviceToken,
          notification: {
            title: notificationTitle,
            body: notificationBody
          },
          data: {
            tokenId: token.id,
            queueId: token.queueId,
            action: 'token_nearing'
          }
        });
      } catch (pushError) {
        console.error('Push notification failed:', pushError.message);
      }
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        organisationId: token.organisationId,
        title: notificationTitle,
        message: notificationBody,
        type: 'TOKEN_REMINDER',
        data: JSON.stringify({
          tokenId: token.id,
          tokenNumber: token.tokenId,
          queueId: token.queueId
        })
      }
    });

    console.log(`✅ Token nearing notification saved for user ${user.email}`);
  } catch (error) {
    console.error('Error sending token nearing notification:', error);
  }
};

// Send queue status update notification
const sendQueueStatusUpdateNotification = async (queueId, status, message) => {
  try {
    // Get all users with active tokens in this queue
    const activeTokens = await prisma.token.findMany({
      where: {
        queueId,
        status: { in: ['PENDING', 'CALLED'] }
      },
      include: {
        tokenUser: {
          include: {
            roleModel: true
          }
        }
      }
    });

    // Send notification to each user
    for (const token of activeTokens) {
      if (!token.tokenUser || token.tokenUser.roleModel?.name !== 'USER') continue;

      // Send push notification
      if (firebaseInitialized && token.tokenUser.deviceToken) {
        try {
          await admin.messaging().send({
            token: token.tokenUser.deviceToken,
            notification: {
              title: 'Queue Status Update',
              body: message
            },
            data: {
              queueId: queueId,
              action: 'queue_status_update'
            }
          });
        } catch (pushError) {
          console.error(`Push notification failed for ${token.tokenUser.email}:`, pushError.message);
        }
      }

      // Create notification record
      await prisma.notification.create({
        data: {
          userId: token.tokenUser.id,
          organisationId: token.organisationId,
          title: 'Queue Status Update',
          message: message,
          type: 'QUEUE_STATUS_UPDATE',
          data: JSON.stringify({
            queueId: queueId,
            status: status
          })
        }
      });
    }

    console.log(`✅ Queue status update notification sent to ${activeTokens.length} users`);
  } catch (error) {
    console.error('Error sending queue status update notification:', error);
  }
};

// Get user notifications
const getUserNotifications = async (userId, limit = 50) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return notifications.map(notif => ({
      ...notif,
      data: typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId) => {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

module.exports = {
  sendTokenCreatedNotification,
  sendTokenCalledNotification,
  sendTokenNearingServiceNotification,
  sendQueueStatusUpdateNotification,
  getUserNotifications,
  markNotificationAsRead
};