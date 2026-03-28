import { Content } from "@/api/interface";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

export const getEmailList = (params: Content.EmailReqParams) => {
  return http.post<Content.EmailListData>(PORT1 + `/content/email/list`, params);
};

export const addEmail = (params: Content.EmailSaveParams) => {
  return http.post(PORT1 + `/content/email/add`, params);
};

export const updateEmail = (params: Content.EmailSaveParams) => {
  return http.post(PORT1 + `/content/email/update`, params);
};

export const sendEmail = (params: Content.EmailDeleteParams) => {
  return http.post(PORT1 + `/content/email/send`, params);
};

export const deleteEmail = (params: Content.EmailDeleteParams) => {
  return http.post(PORT1 + `/content/email/delete`, params);
};

export const getNotificationList = (params: Content.NotificationReqParams) => {
  return http.post<Content.NotificationListData>(PORT1 + `/content/notification/list`, params);
};

export const addNotification = (params: Content.NotificationSaveParams) => {
  return http.post(PORT1 + `/content/notification/add`, params);
};

export const updateNotification = (params: Content.NotificationSaveParams) => {
  return http.post(PORT1 + `/content/notification/update`, params);
};

export const deleteNotification = (params: Content.NotificationDeleteParams) => {
  return http.post(PORT1 + `/content/notification/delete`, params);
};
