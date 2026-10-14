import type { NullToOptional } from '@/shared/lib/optional';
import type {
    ChannelAttachmentView as ServerChannelAttachmentView,
    ChatAttachmentView as ServerChatAttachmentView,
    ChatChannelsView as ServerChatChannelsView,
    ChatContactView as ServerChatContactView,
    ChatLastMessageView as ServerChatLastMessageView,
    ChatLinkView as ServerChatLinkView,
    ChatMessageReactionView as ServerChatMessageReactionView,
    ChatMessageReplyView as ServerChatMessageReplyView,
    ChatMessageView as ServerChatMessageView,
    ChatProjectChannelView as ServerChatProjectChannelView,
    ChatSearchResultView as ServerChatSearchResultView,
    ChatThreadView as ServerChatThreadView,
    ChatUserView as ServerChatUserView,
    DirectChannelView as ServerDirectChannelView,
} from './Chat.types';

export * from './Chat.actions';
export * from './Chat.schema';
export * from './Chat.types';
export * from './useChats';

export type ChannelAttachmentView = NullToOptional<ServerChannelAttachmentView>;
export type ChatAttachmentView = NullToOptional<ServerChatAttachmentView>;
export type ChatChannelsView = NullToOptional<ServerChatChannelsView>;
export type ChatContactView = NullToOptional<ServerChatContactView>;
export type ChatLastMessageView = NullToOptional<ServerChatLastMessageView>;
export type ChatLinkView = NullToOptional<ServerChatLinkView>;
export type ChatMessageReactionView =
    NullToOptional<ServerChatMessageReactionView>;
export type ChatMessageReplyView = NullToOptional<ServerChatMessageReplyView>;
export type ChatMessageView = NullToOptional<ServerChatMessageView>;
export type ChatProjectChannelView =
    NullToOptional<ServerChatProjectChannelView>;
export type ChatSearchResultView = NullToOptional<ServerChatSearchResultView>;
export type ChatThreadView = NullToOptional<ServerChatThreadView>;
export type ChatUserView = NullToOptional<ServerChatUserView>;
export type DirectChannelView = NullToOptional<ServerDirectChannelView>;
