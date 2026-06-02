const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');

// @desc    Upload progress photo
// @route   POST /api/photos/upload
const uploadPhoto = async (req, res, next) => {
  try {
    const { angle, notes, date } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const photo = await prisma.progressPhoto.create({
      data: {
        user_id: req.user.id,
        image_url: imageUrl,
        angle: angle || 'front',
        notes: notes || null,
        date: date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]),
      },
    });

    res.status(201).json({ success: true, data: photo });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user progress photos
// @route   GET /api/photos
const getPhotos = async (req, res, next) => {
  try {
    const photos = await prisma.progressPhoto.findMany({
      where: { user_id: req.user.id },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: photos });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete progress photo
// @route   DELETE /api/photos/:id
const deletePhoto = async (req, res, next) => {
  try {
    const photoId = parseInt(req.params.id);
    const photo = await prisma.progressPhoto.findFirst({
      where: { id: photoId, user_id: req.user.id },
    });

    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Attempt to delete local file from disk
    const filename = photo.image_url.split('/uploads/')[1];
    if (filename) {
      const filePath = path.join(__dirname, '../public/uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.progressPhoto.delete({ where: { id: photoId } });

    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadPhoto, getPhotos, deletePhoto };
