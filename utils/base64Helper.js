function decodeBase64Url(data) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
export { decodeBase64Url };