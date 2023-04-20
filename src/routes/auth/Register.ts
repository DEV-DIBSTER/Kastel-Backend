/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { HTTPErrors } from '@kastelll/util';
import { Route } from '@kastelll/core';
import Constants from '../../Constants';
import Encryption from '../../Utils/Classes/Encryption';
import { SettingSchema, UserSchema } from '../../Utils/Schemas/Schemas';
import { Config } from '../../Config';
import { hashSync } from 'bcrypt';
import Token from '../../Utils/Classes/Token';
import TagGenerator from '../../Utils/TagGenerator';
import User from '../../Middleware/User';
import Captcha from '../../Middleware/Captcha';
import EMailTemplate from '../../Utils/Classes/EmailTemplate';

new Route(
	'/register',
	'POST',
	[
		User({
			AccessType: 'LoggedOut',
			AllowedRequesters: 'User',
		}),
		Captcha({
			Enabled: Constants.Settings.Captcha.Register,
		}),
	],
	async (req, res) => {
		const { username, email, password }: { username: string; email: string; password: string; invite?: string } =
			req.body;

		if (!email || !password || !username) {
			const Errors = new HTTPErrors(4007);

			if (!email)
				Errors.AddError({
					Email: { Code: 'EmailRequired', Message: 'Email is required' },
				});

			if (!password)
				Errors.AddError({
					password: {
						Code: 'PasswordRequired',
						Message: 'Password is required',
					},
				});

			if (!username)
				Errors.AddError({
					username: {
						Code: 'UsernameRequired',
						Message: 'Username is required',
					},
				});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const UsersCache =
			(await req.app.cache.get(`fullusers:${Encryption.encrypt(email)}`)) ||
			(await UserSchema.findOne({ Email: Encryption.encrypt(email) }));
		const AllUsers = await UserSchema.find({
			Username: Encryption.encrypt(username),
		});

		if (UsersCache || AllUsers.length >= Constants.Settings.Max.UsernameCount) {
			const Errors = new HTTPErrors(4008);

			if (UsersCache)
				Errors.AddError({
					Email: { Code: 'EmailTaken', Message: 'Email is taken' },
				});

			if (AllUsers.length >= Constants.Settings.Max.UsernameCount)
				Errors.AddError({
					Username: { Code: 'UsernameTaken', Message: 'Username is taken' },
				});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (
			!password.match(Config.Regexs.Password) ||
			!email.match(Config.Regexs.Email) ||
			!(username.length >= Constants.Settings.Min.UsernameLength) ||
			!(username.length <= Constants.Settings.Max.UsernameLength)
		) {
			const Errors = new HTTPErrors(4009);

			if (!password.match(Config.Regexs.Password))
				Errors.AddError({
					Password: { Code: 'PasswordInvalid', Message: 'Password is invalid' },
				});

			if (!email.match(Config.Regexs.Email))
				Errors.AddError({
					Email: { Code: 'EmailInvalid', Message: 'Email is invalid' },
				});

			if (
				!(username.length >= Constants.Settings.Min.UsernameLength) ||
				!(username.length <= Constants.Settings.Max.UsernameLength)
			)
				Errors.AddError({
					Username: { Code: 'UsernameInvalid', Message: 'Username is invalid' },
				});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const GeneratedTag = TagGenerator(AllUsers.map((User) => User.Tag));

		const User = new UserSchema({
			_id: Encryption.encrypt(req.app.snowflake.Generate()),
			Email: Encryption.encrypt(email),
			EmailVerified: false,
			Username: Encryption.encrypt(username),
			Tag: GeneratedTag,
			AvatarHash: null,
			Password: hashSync(password, 10),
			PhoneNumber: null,
			TwoFa: false,
			TwoFaSecret: null,
			TwoFaVerified: false,
			Ips: [],
			Flags: 0,
			Guilds: [],
			Dms: [],
			GroupChats: [],
			Bots: [],
			Banned: false,
			BanReason: null,
			Locked: false,
			AccountDeletionInProgress: false,
		});

		await User.save();

		const UserToken = Token.GenerateToken(Encryption.decrypt(User._id));

		const Settings = new SettingSchema({
			User: User._id,
			Tokens: [
				{
					Token: Encryption.encrypt(UserToken),
					Ip: Encryption.encrypt(req.ip),
					CreatedDate: Date.now(),
				},
			],
		});

		await Settings.save();

		res.status(200).json({
			Token: UserToken,
			User: {
				Id: Encryption.decrypt(User._id),
				Username: username,
				Tag: User.Tag,
				Avatar: null,
				Flags: 0,
				Email: email,
			},
		});

		if (req.NoReply) {
			const { Code } = await req.utils.VerificationLink(
				Constants.VerificationFlags.VerifyEmail,
				Encryption.decrypt(User._id),
			);

			await req.NoReply.SendEmail(
				email,
				'Email Verification',
				undefined,
				await EMailTemplate.EmailVerification(
					username,
					`${Config.Server.Secure ? 'https' : 'http'}://${Config.Server.Domain}/verify/${Code}`,
				),
			);
		}

		return;
	},
);
