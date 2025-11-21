// Base44 DESABILITADO - Usando banco de dados próprio
// Este arquivo está desabilitado

// import { base44 } from './base44Client';

// DESABILITADO - Integrações do Base44 não estão disponíveis
// Se precisar dessas funcionalidades, implemente-as usando a nova API

export const Core = null;
export const InvokeLLM = null;
export const SendEmail = null;

// Upload de arquivos usando a nova API
export async function UploadFile({ file }) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const token = localStorage.getItem('auth_token');

  if (!file) {
    throw new Error('Nenhum arquivo fornecido');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao fazer upload' }));
    throw new Error(error.error || 'Erro ao fazer upload do arquivo');
  }

  const data = await response.json();
  
  // Se a URL já for absoluta, usar diretamente
  // Caso contrário, construir a URL completa
  let fileUrl = data.file_url;
  if (!fileUrl.startsWith('http')) {
    const baseUrl = API_BASE_URL.replace('/api', '');
    fileUrl = `${baseUrl}${data.file_url.startsWith('/') ? '' : '/'}${data.file_url}`;
  }
  
  return {
    file_url: fileUrl,
    filename: data.filename,
    originalname: data.originalname,
    size: data.size,
    mimetype: data.mimetype
  };
}

export const GenerateImage = null;
export const ExtractDataFromUploadedFile = null;






