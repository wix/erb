
module.exports = patchResponse => {
  patchResponse.patch();
  return () => patchResponse.unpatch();
};
