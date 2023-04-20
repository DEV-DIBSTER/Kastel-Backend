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
import { compareSync } from 'bcrypt';
import Constants from '../../../../Constants';
import User from '../../../../Middleware/User';
import Encryption from '../../../../Utils/Classes/Encryption';
import { SettingSchema, UserSchema } from '../../../../Utils/Schemas/Schemas';

interface DisableBody {
	password: string;
}

new Route(
	'/',
	'PUT',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { password } = req.body as DisableBody;

		if (!password) {
			const Errors = new HTTPErrors(4013);

			Errors.AddError({
				Password: {
					Code: 'MissingPassword',
					Message: 'You must provide your password to disable your account',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const FoundUser = await UserSchema.findById(Encryption.encrypt(req.user.Id));

		if (!compareSync(password, FoundUser?.Password as string)) {
			const Errors = new HTTPErrors(4006);

			Errors.AddError({
				Password: {
					Code: 'PasswordIncorrect',
					Message: 'Password is incorrect',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		await FoundUser?.updateOne({
			$set: {
				Locked: true,
				Flags: (FoundUser?.Flags as number) | Number(Constants.Flags.WaitingOnDisableDataUpdate),
			},
		});

		const UsersSettings = await SettingSchema.findOne({
			User: Encryption.encrypt(req.user.Id),
		});

		if (UsersSettings) {
			await UsersSettings.updateOne({
				$set: {
					Tokens: [],
				},
			});
		}

		res.status(200).json({
			Success: true,
			Message: 'Account disabled',
		});

		return;
	},
);
