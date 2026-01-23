const fs = require('fs');
const path = require('path');

// 动态导入 SDK
async function uploadPackage() {
  const { S3Storage } = await import('coze-coding-dev-sdk');

  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  const packagePath = '/workspace/projects/child-product-design-assistant-v8.0.0-mobile.tar.gz';
  const fileName = 'child-product-design-assistant-v8.0.0-mobile.tar.gz';

  // 读取文件内容
  const fileContent = fs.readFileSync(packagePath);

  console.log('开始上传文件...');
  
  // 上传文件
  const fileKey = await storage.uploadFile({
    fileContent: fileContent,
    fileName: fileName,
    contentType: 'application/gzip',
  });

  console.log('文件上传成功，key:', fileKey);

  // 生成签名 URL（有效期 7 天）
  const downloadUrl = await storage.generatePresignedUrl({
    key: fileKey,
    expireTime: 604800, // 7 天
  });

  console.log('\n========================================');
  console.log('✅ 打包上传成功！');
  console.log('========================================');
  console.log('文件名:', fileName);
  console.log('文件大小:', (fileContent.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('版本:', 'V8.0.0');
  console.log('\n📥 下载链接:');
  console.log(downloadUrl);
  console.log('\n⏰ 有效期: 7 天');
  console.log('========================================\n');

  return downloadUrl;
}

uploadPackage().catch(console.error);
