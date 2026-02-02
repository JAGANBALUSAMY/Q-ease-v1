import notificationService from '../services/notificationService';

const useNotifications = () => {
  const addNotification = (payload) => {
    return notificationService.addNotification(payload);
  };

  const getNotifications = () => {
    return notificationService.getNotifications();
  };

  const clearNotifications = () => {
    return notificationService.clearNotifications();
  };

  return {
    addNotification,
    getNotifications,
    clearNotifications,
  };
};

export default useNotifications;