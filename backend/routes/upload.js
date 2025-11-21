import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Criar pasta de uploads se não existir
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Extensões permitidas
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// MIME types permitidos (validação mais rigorosa)
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Filtro para aceitar apenas imagens (validação robusta)
const fileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype ? file.mimetype.toLowerCase() : '';

  // Validar extensão (primeira camada de segurança)
  if (!allowedExtensions.includes(extname)) {
    return cb(new Error(`Extensão não permitida: ${extname}. Permitidas: ${allowedExtensions.join(', ')}`));
  }

  // Validar MIME type (segunda camada de segurança - mais rigorosa)
  // Verificar se o MIME type está na lista permitida
  if (!mimetype || !allowedMimeTypes.includes(mimetype)) {
    return cb(new Error(`Tipo de arquivo não permitido: ${mimetype || 'desconhecido'}. Tipos permitidos: ${allowedMimeTypes.join(', ')}`));
  }

  // Validar que o MIME type corresponde à extensão (terceira camada)
  const mimeToExt = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  };
  
  const validExts = mimeToExt[mimetype] || [];
  if (!validExts.includes(extname)) {
    return cb(new Error(`Extensão ${extname} não corresponde ao tipo MIME ${mimetype}`));
  }

  // Se passou em todas as validações, aceitar
  cb(null, true);
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB padrão

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize,
    files: 10 // Máximo de arquivos por requisição
  },
  fileFilter: fileFilter
});

// Rota de upload de arquivo único
router.post('/', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'Erro ao processar arquivo' });
    }
    next();
  });
}, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // URL completa para servir o arquivo
    const fileUrl = `${req.protocol}://${req.get('host')}/api/upload/uploads/${req.file.filename}`;
    
    res.json({
      file_url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

// Rota para servir arquivos estáticos (removida daqui, agora está no server.js antes do rate limiting)

export default router;

