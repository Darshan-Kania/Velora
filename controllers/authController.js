const handleGoogleCallback = async (req, res) => {
  const { profile, accessToken, refreshToken } = req.user;

  const user = await upsertGoogleUser({ profile, accessToken, refreshToken });

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
  res.redirect(`https://mailflare.tech/auth/success?token=${token}`);
};
