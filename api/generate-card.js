const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
  // CORS ayarları ve sadece POST kabulü
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri kabul edilir.' });
  }

  try {
    const { name, surname, avatarBase64 } = req.body;
    
    if (!avatarBase64) {
      return res.status(400).json({ error: 'Lütfen bir fotoğraf yükleyin.' });
    }

    const fullName = `${name.toUpperCase()} ${surname.toUpperCase()}`;

    // 1. Adım: Base64 formatındaki fotoğrafı Cloudinary'ye yüklüyoruz
    const userImage = await cloudinary.uploader.upload(avatarBase64, {
      folder: 'antakya_belediyesi_taraftar/users'
    });

    // URL'de hata olmaması için klasör yolundaki eğik çizgileri iki noktaya çeviriyoruz
    const userPublicId = userImage.public_id.replace(/\//g, ':');

    // 2. Adım: Görseli AI ile birleştiriyoruz (Şablon adı: antakya_sablon.png)
    const generatedCardUrl = cloudinary.url('antakya_sablon.png', {
      transformation: [
        {
          overlay: userPublicId,
          gravity: "face",
          crop: "thumb",
          width: 300,
          height: 300,
          radius: "max"
        },
        { flags: "layer_apply", x: 0, y: -150 },
        {
          overlay: {
            font_family: "Arial", 
            font_size: 28, 
            font_weight: "bold", 
            text: fullName
          },
          color: "#ffffff"
        },
        { flags: "layer_apply", x: 0, y: 200 }
      ]
    });

    return res.status(200).json({ success: true, cardUrl: generatedCardUrl });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Kart oluşturulurken bir hata meydana geldi.' });
  }
};
