import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Criar pasta de uploads se não existir
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const fsPromises = fs.promises;

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

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 25 * 1024 * 1024; // 25MB limite duro
const compressionThreshold = parseInt(process.env.UPLOAD_COMPRESSION_THRESHOLD, 10) || 5 * 1024 * 1024; // 5MB
const optimizedMaxSize = parseInt(process.env.UPLOAD_OPTIMIZED_MAX_SIZE, 10) || 5 * 1024 * 1024; // 5MB
const maxImageDimension = parseInt(process.env.UPLOAD_MAX_IMAGE_DIMENSION, 10) || 1920;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: 10 // Máximo de arquivos por requisição
  },
  fileFilter: fileFilter
});

async function optimizeImage(file) {
  const originalSize = file.size;
  const originalExt = path.extname(file.originalname).toLowerCase();
  const originalMime = file.mimetype;

  if (originalSize <= compressionThreshold) {
    return {
      buffer: file.buffer,
      extension: originalExt,
      mimetype: originalMime,
      optimized: false,
      originalSize,
      finalSize: originalSize
    };
  }

  let quality = 85;
  const minQuality = 50;
  let processed = {
    data: file.buffer,
    info: null
  };

  while (quality >= minQuality) {
    processed = await sharp(file.buffer)
      .rotate()
      .resize({
        width: maxImageDimension,
        height: maxImageDimension,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (processed.data.length <= optimizedMaxSize || quality === minQuality) {
      break;
    }

    quality -= 10;
  }

  return {
    buffer: processed.data,
    extension: '.webp',
    mimetype: 'image/webp',
    optimized: true,
    originalSize,
    finalSize: processed.data.length,
    metadata: processed.info
  };
}

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
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const processed = await optimizeImage(req.file);
    const uniqueName = `${uuidv4()}${processed.extension}`;
    const finalPath = path.join(uploadsDir, uniqueName);

    await fsPromises.writeFile(finalPath, processed.buffer);

    // URL completa para servir o arquivo
    const fileUrl = `${req.protocol}://${req.get('host')}/api/upload/uploads/${uniqueName}`;
    
    res.json({
      file_url: fileUrl,
      filename: uniqueName,
      originalname: req.file.originalname,
      size: processed.finalSize,
      mimetype: processed.mimetype,
      optimized: processed.optimized,
      original_size: processed.originalSize
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

// Rota para servir arquivos estáticos (removida daqui, agora está no server.js antes do rate limiting)

export default router;

