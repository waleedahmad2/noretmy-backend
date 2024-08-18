// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('./cloudinaryConfig'); // Ensure correct path

// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: (req, file) => {
//         let folder;
//         if (file.mimetype.startsWith('image')) {
//             folder = 'photos';
//         } else if (file.mimetype.startsWith('video')) {
//             folder = 'videos';
//         } else if (file.mimetype.startsWith('audio')) {
//             folder = 'audios';
//         }

//         return {
//             folder: folder,
//             allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mkv', 'mp3', 'wav','pdf'],
//             public_id: `${Date.now()}_${file.originalname}`,
//         };s
//     },
// });

// const upload = multer({ storage: storage });

// module.exports = upload;
