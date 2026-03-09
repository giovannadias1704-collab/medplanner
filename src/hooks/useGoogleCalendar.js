import { useState, useEffect } from 'react';

// Hook para gerenciar sincronização com Google Calendar
export function useGoogleCalendar() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  // Suas credenciais - SUBSTITUA COM SEU CLIENT ID
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

  // Inicializar GAPI
  useEffect(() => {
    const initializeGapiClient = async () => {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      setGapiInited(true);
    };

    if (window.gapi) {
      window.gapi.load('client', initializeGapiClient);
    }
  }, []);

  // Inicializar GIS (Google Identity Services)
  useEffect(() => {
    if (window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            setIsSignedIn(true);
            setIsLoading(false);
          }
        },
      });
      setTokenClient(client);
      setGisInited(true);
    }
  }, []);

  // Fazer login
  const signIn = () => {
    if (tokenClient) {
      setIsLoading(true);
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  // Fazer logout
  const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      setIsSignedIn(false);
    }
  };

  // Criar evento no Google Calendar
  const createGoogleEvent = async (event) => {
    if (!isSignedIn) {
      throw new Error('Usuário não conectado ao Google Calendar');
    }

    try {
      const startDateTime = `${event.date}T${event.time || '09:00'}:00`;
      const endDateTime = event.endTime 
        ? `${event.date}T${event.endTime}:00`
        : `${event.date}T${event.time ? addMinutes(event.time, 60) : '10:00'}:00`;

      const googleEvent = {
        summary: event.title,
        description: event.description || '',
        location: event.location || '',
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: event.alertMinutes || 30 },
          ],
        },
        colorId: getColorId(event.color || event.type),
      };

      // Adicionar recorrência se necessário
      if (event.recurrence && event.recurrence !== 'none') {
        googleEvent.recurrence = [getRecurrenceRule(event.recurrence)];
      }

      const request = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent,
      });

      return request.result;
    } catch (error) {
      console.error('Erro ao criar evento no Google Calendar:', error);
      throw error;
    }
  };

  // Atualizar evento no Google Calendar
  const updateGoogleEvent = async (eventId, event) => {
    if (!isSignedIn) return;

    try {
      const startDateTime = `${event.date}T${event.time || '09:00'}:00`;
      const endDateTime = event.endTime 
        ? `${event.date}T${event.endTime}:00`
        : `${event.date}T${event.time ? addMinutes(event.time, 60) : '10:00'}:00`;

      const googleEvent = {
        summary: event.title,
        description: event.description || '',
        location: event.location || '',
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: event.alertMinutes || 30 },
          ],
        },
        colorId: getColorId(event.color || event.type),
      };

      const request = await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: googleEvent,
      });

      return request.result;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  };

  // Deletar evento do Google Calendar
  const deleteGoogleEvent = async (eventId) => {
    if (!isSignedIn) return;

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  };

  // Sincronizar eventos do Google Calendar
  const syncFromGoogle = async (startDate, endDate) => {
    if (!isSignedIn) return [];

    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: `${endDate}T23:59:59Z`,
        showDeleted: false,
        singleEvents: true,
        maxResults: 250,
        orderBy: 'startTime',
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error);
      return [];
    }
  };

  return {
    isSignedIn,
    isLoading,
    isReady: gapiInited && gisInited,
    signIn,
    signOut,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    syncFromGoogle,
  };
}

// Helpers
function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function getRecurrenceRule(recurrence) {
  switch (recurrence) {
    case 'daily':
      return 'RRULE:FREQ=DAILY';
    case 'weekly':
      return 'RRULE:FREQ=WEEKLY';
    case 'monthly':
      return 'RRULE:FREQ=MONTHLY';
    default:
      return '';
  }
}

function getColorId(typeOrColor) {
  // Google Calendar Color IDs
  const colorMap = {
    event: '9',    // Azul
    task: '10',    // Verde
    routine: '5',  // Amarelo
    reminder: '11', // Vermelho
    exam: '3',     // Roxo
    health: '4',   // Rosa
    study: '7',    // Ciano
    finance: '6',  // Laranja
  };
  return colorMap[typeOrColor] || '9';
}