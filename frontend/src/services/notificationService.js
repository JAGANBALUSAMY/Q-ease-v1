// Notification service (localStorage-backed)
const STORAGE_KEY = 'qease_notifications_v1';

const readStorage = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('Failed to read notifications from storage', e);
		return [];
	}
};

const writeStorage = (items) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch (e) {
		console.error('Failed to write notifications to storage', e);
	}
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getNotifications = () => {
	return readStorage();
};

const addNotification = ({ title, body, data } = {}) => {
	const items = readStorage();
	const item = {
		id: generateId(),
		title: title || 'Notification',
		body: body || '',
		data: data || null,
		createdAt: new Date().toISOString(),
		read: false,
	};
	items.unshift(item);
	writeStorage(items);
	return item;
};

const clearNotifications = () => {
	writeStorage([]);
};

export default {
	getNotifications,
	addNotification,
	clearNotifications,
};