'use client';

import { useState } from 'react';
import { MessageSquare, Send, Paperclip, MoreVertical, Check, CheckCheck, Clock } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'Dra. Ana Martínez',
    role: 'Tutora - Facultad de Medicina',
    avatar: null,
    lastMessage: 'Perfecto, nos vemos el lunes a las 10am para revisar el avance',
    time: '10:30',
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: 'Hola María, ¿cómo va el proyecto de automatización?', sender: 'other', time: '09:15' },
      { id: 2, text: 'Muy bien, ya tengo los macros funcionando', sender: 'me', time: '09:20' },
      { id: 3, text: 'Excelente. ¿Podemos vernos el lunes?', sender: 'other', time: '10:30' },
    ],
  },
  {
    id: 2,
    name: 'Ing. Carlos Rodríguez',
    role: 'Líder TI - Dirección de Tecnologías',
    avatar: null,
    lastMessage: 'Te envié el acceso al repositorio de Power BI',
    time: 'Ayer',
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: 'Carlos, necesito acceso al workspace de Power BI', sender: 'me', time: 'Ayer 14:00' },
      { id: 2, text: 'Te envié el acceso al repositorio de Power BI', sender: 'other', time: 'Ayer 14:30' },
    ],
  },
  {
    id: 3,
    name: 'Lic. Patricia Gómez',
    role: 'Coordinadora PAT - Gestión Humana',
    avatar: null,
    lastMessage: 'Recuerda subir tu reporte de horas esta semana',
    time: 'Lun',
    unread: 1,
    online: true,
    messages: [
      { id: 1, text: 'Hola, recordatorio para subir horas', sender: 'other', time: 'Lun 08:00' },
    ],
  },
];

export default function MensajesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, { id: Date.now(), text: newMessage, sender: 'me', time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }],
      lastMessage: newMessage,
      time: 'Ahora',
    }));
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden">
      {/* Conversations List */}
      <aside className="w-80 lg:w-96 flex-shrink-0 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Mensajes</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                selectedConversation.id === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt={conv.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      {conv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  )}
                </div>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-neutral-900 truncate">{conv.name}</h4>
                  <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">{conv.time}</span>
                </div>
                <p className="text-sm text-neutral-500 truncate">{conv.role}</p>
                <p className="text-sm text-neutral-600 truncate mt-1">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {conv.unread > 9 ? '9+' : conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-4 p-4 border-b border-neutral-200 bg-white">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedConversation.avatar ? (
                    <img src={selectedConversation.avatar} alt={selectedConversation.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-primary">
                      {selectedConversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  )}
                </div>
                {selectedConversation.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 truncate">{selectedConversation.name}</h3>
                <p className="text-sm text-neutral-500 truncate">{selectedConversation.role}</p>
              </div>
              <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
              {selectedConversation.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${msg.sender === 'me' ? 'bg-primary text-white' : 'bg-white text-neutral-900'} rounded-2xl px-4 py-2 shadow-sm`}>
                    <p className="text-sm">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${msg.sender === 'me' ? 'justify-end text-primary/70' : 'justify-start text-neutral-400'}`}>
                      <span>{msg.time}</span>
                      {msg.sender === 'me' && (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <CheckCheck className="w-3.5 h-3.5" />
                        </>
                      )}
                      {msg.sender === 'other' && <Clock className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              ))}
              <div id="messages-end" />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-neutral-200 bg-white flex items-center gap-2">
              <button type="button" className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Selecciona una conversación</h3>
              <p className="text-neutral-500">Elige un chat de la lista para comenzar a escribir</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}