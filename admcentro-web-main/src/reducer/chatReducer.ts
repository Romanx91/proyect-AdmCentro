type types = { type: 'updateChatId'; payload: any } | { type: 'clearCurentChat' };

export const chatReducer = (state: any, action: types): any => {
  switch (action.type) {
    case 'updateChatId':
      return {
        ...state,
        chatId: action.payload.chatId,
        user: action.payload.user,
      };
    case 'clearCurentChat':
      return {
        ...state,
        chatId: null,
        user: null,
      };
    default:
      return state;
  }
};
