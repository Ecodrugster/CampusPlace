from django.urls import path
from .views import (
    ConversationListCreateView,
    MessageListView,
    ConversationDealStatusView,
    UnreadTotalView,
)

urlpatterns = [
    path("conversations", ConversationListCreateView.as_view()),
    path("conversations/", ConversationListCreateView.as_view()),
    path("conversations/unread-total", UnreadTotalView.as_view()),
    path("conversations/unread-total/", UnreadTotalView.as_view()),
    path("conversations/<int:conversation_id>/messages", MessageListView.as_view()),
    path("conversations/<int:conversation_id>/messages/", MessageListView.as_view()),
    path("conversations/<int:conversation_id>/deal-status", ConversationDealStatusView.as_view()),
    path("conversations/<int:conversation_id>/deal-status/", ConversationDealStatusView.as_view()),
]
