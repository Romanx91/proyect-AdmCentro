const jwt = require('jsonwebtoken');
const AppError = require('../../helpers/AppError');
const { catchAsync } = require('../../helpers/catchAsync');
const { Auth } = require('../../models');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { promisify } = require('util');

const { all, findOne } = require('../Generic/FactoryGeneric');
const Email = require('../../helpers/email');

const createToken = (user) => {
  return jwt.sign(user, process.env.SECRET_TOKEN, {
    expiresIn: '30d',
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = createToken({
    id: user.id,
    uuid: user.uuid,
    // role: user.role, no existe role todavia
    email: user.email,
    fullName: user.fullName,
    photo: user.photo,
  });

  return res.status(statusCode).json({
    status: 'success',
    ok: true,
    code: 200,
    token,
  });
};

exports.GetAll = all(Auth);
exports.GetById = findOne(Auth);

exports.SignUp = catchAsync(async (req, res, next) => {
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/.test(req.body.password))
    return next(
      new AppError(
        'La contraseña debe contener al menos 8 y máximo 20 caracteres, incluidos al menos 1 mayúscula, 1 minúscula, un número y un carácter especial.',
        400
      )
    );

  const newUser = await Auth.create(req.body, { fields: ['email', 'password', 'fullName', 'uuid', 'photo'] });
  return res.json({
    status: 201,
    success: 'success',
    ok: true,
    message: 'El usuario fue creado con exito',
    data: newUser,
  });
  // createSendToken(newUser, 201, res);
});

exports.SignIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('Proporcione un correo electrónico y una contraseña por favor.', 400));

  const user = await Auth.findOne({ where: { email } });

  if (!user || !(await user.checkPassword(password, user.password)))
    return next(new AppError('Correo y/o contraseña incorrectos.', 401));

  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) return next(new AppError('El correo es requerido.', 404));

  const user = await Auth.findOne({ where: { email: req.body.email } });
  if (!user) return next(new AppError('No existe un usuario con este correo electrónico.', 404));

  const resetToken = user.createPasswordResetToken();
  await user.save();

  try {
    const resetURL = `${process.env.FRONT_URL}/resetPassword/${resetToken}`;
    await new Email({ ...user.dataValues, url: resetURL }).sendPasswordReset();
    res.status(200).json({
      ok: true,
      code: 200,
      status: 'success',
      message: 'Email enviado con éxito.',
    });
  } catch (err) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return next(new AppError('Hubo un problema al intentar enviar el mail.', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get Uer based on the token
  if (!req.params.token) return next(new AppError('Token inválido o caducado.', 404));
  if (!req.body.password || !req.body.passwordConfirm) return next(new AppError('Proporcione una contraseña y su confirmación', 400));
  const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await Auth.findOne({
    where: { passwordResetToken: hashToken, passwordResetExpires: { [Op.gt]: Date.now() } },
  });

  if (!user) return next(new AppError('No existe un usuario para este token o el token no es válido o esta caducado.', 404));

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/.test(req.body.password))
    return next(new AppError('La contraseña debe contener al menos 8 y máximo 20 caracteres, incluidos al menos 1 mayúscula, 1 minúscula, un número y un carácter especial.', 400))

  //validate user and token
  user.password = await user.hashPassword(req.body.password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  //Log in user again
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get the user
  const user = await Auth.findOne({ where: { email: req.user.email } });

  //check password
  if (!user || !(await user.checkPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Contraseña incorrecta', 401));
  }

  //update password
  user.password = await user.hashPassword(req.body.password);
  await user.save();

  createSendToken(user, 200, res);
});

exports.checkToken = catchAsync(async (req, res, next) => {

  const token = req.body.token
  if (!token) return next(new AppError('No se ha proporcionado un token.', 401));

  const decoded = await promisify(jwt.verify)(token, process.env.SECRET_TOKEN);

  const currentUser = await Auth.findOne({ where: { id: decoded.id } });

  if (!currentUser) return next(new AppError('El usuario ya no existe.', 401));

  if (currentUser.changePasswordAfter(decoded.iat)) return next(new AppError('El usuario cambió la contraseña recientemente. Por favor, inicie sesión de nuevo.', 401));

  const newtoken = createToken({
    id: currentUser.id,
    uuid: currentUser.uuid,
    // role: currentUser.role, no existe role todavia
    email: currentUser.email,
    fullName: currentUser.fullName,
    photo: currentUser.photo,
  });
  res.status(200).json({
    status: 'success',
    ok: true,
    code: 200,
    token: newtoken
  });
});