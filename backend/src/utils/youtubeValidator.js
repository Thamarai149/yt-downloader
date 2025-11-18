export const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|playlist\?list=|embed\/|v\/)|youtu\.be\/)/;
  return regex.test(url);
};

export const extractVideoId = (url) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
};

export const extractPlaylistId = (url) => {
  const match = url.match(/[?&]list=([^&\s]+)/);
  return match ? match[1] : null;
};
