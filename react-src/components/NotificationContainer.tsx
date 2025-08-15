import React from 'react';
import { NotificationData } from '../types';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type} show`}
        >
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close"
              onClick={() => onRemove(notification.id)}
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
