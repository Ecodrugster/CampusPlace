from django.db.models import Q
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        user = self.scope["user"]
        if not user or not user.is_authenticated:
            print(f"[WebSocket] User not authenticated: {user}")
            await self.close(code=4001)
            return

        is_participant = await self.check_participant(user)
        if not is_participant:
            print(f"[WebSocket] User {user.id} is not participant of conversation {self.conversation_id}")
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"[WebSocket] User {user.id} connected to chat {self.conversation_id}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        text = data.get("text", "").strip()
        if not text:
            return

        user = self.scope["user"]
        message = await self.save_message(user, text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message_id": message.id,
                "sender_id": user.id,
                "sender_name": user.full_name,
                "text": text,
                "created_at": message.created_at.isoformat(),
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def check_participant(self, user):
        return Conversation.objects.filter(
            id=self.conversation_id
        ).filter(Q(buyer=user) | Q(seller=user)).exists()

    @database_sync_to_async
    def save_message(self, user, text):
        conversation = Conversation.objects.get(id=self.conversation_id)
        return Message.objects.create(conversation=conversation, sender=user, text=text)