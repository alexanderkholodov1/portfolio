// Words of the admin's request desk. They live apart from copy.ts so they reach the browser only inside the desk's
// own script, which loads after the admin role is confirmed.
export const deskCopy = {
  en: {
    section: 'Admin', desk: 'Client requests', clients: 'Clients',
    title: ['Client ', 'requests'], lead: 'Everything clients have sent, most recent first.', search: 'Search by name, email or idea',
    all: 'All', drafts: 'Show drafts', empty: 'No requests here.', unread: 'New message', back: 'Client requests',
    status: 'Status', priority: 'Priority', priorities: { '': 'No priority', high: 'High', medium: 'Medium', low: 'Low' },
    save: 'Save', saved: 'Saved', reply: 'Conversation with the client', replyLead: 'The client sees these messages in their account.',
    notes: 'Private notes', notesLead: 'Only you see them.', note: 'Write a note…', addNote: 'Add note',
    reach: 'Reach the client', email: 'Email', whatsapp: 'WhatsApp', call: 'Call', you: 'You', client: 'Client',
    clientsTitle: ['', 'Clients'], clientsLead: 'People with an account, newest first.', requests: 'requests', joined: 'Since', noClients: 'No clients yet.',
  },
  es: {
    section: 'Administración', desk: 'Solicitudes de clientes', clients: 'Clientes',
    title: ['Solicitudes de ', 'clientes'], lead: 'Todo lo que te han enviado, lo más reciente primero.', search: 'Buscar por nombre, correo o idea',
    all: 'Todas', drafts: 'Ver borradores', empty: 'No hay solicitudes aquí.', unread: 'Mensaje nuevo', back: 'Solicitudes de clientes',
    status: 'Estado', priority: 'Prioridad', priorities: { '': 'Sin prioridad', high: 'Alta', medium: 'Media', low: 'Baja' },
    save: 'Guardar', saved: 'Guardado', reply: 'Conversación con el cliente', replyLead: 'El cliente ve estos mensajes en su cuenta.',
    notes: 'Notas privadas', notesLead: 'Solo tú las ves.', note: 'Escribe una nota…', addNote: 'Agregar nota',
    reach: 'Contactar al cliente', email: 'Correo', whatsapp: 'WhatsApp', call: 'Llamar', you: 'Tú', client: 'Cliente',
    clientsTitle: ['', 'Clientes'], clientsLead: 'Las personas con cuenta, las más recientes primero.', requests: 'solicitudes', joined: 'Desde', noClients: 'Aún no hay clientes.',
  },
};
