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

import { Route } from '@kastelll/core';
import User from '../../Middleware/User.js';
import Encryption from '../../Utils/Classes/Encryption.js';
import { SettingSchema } from '../../Utils/Schemas/Schemas.js';

new Route(
	'/logout',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
			Flags: [],
		}),
	],
	async (req, res) => {
		const FoundSchema = await SettingSchema.findOne({
			User: Encryption.encrypt(req.user.Id),
			'Tokens.Token': Encryption.encrypt(req.user.Token),
		});

		if (FoundSchema) {
			FoundSchema.Tokens = FoundSchema.Tokens.filter((Token) => Token.Token !== Encryption.encrypt(req.user.Token));

			await FoundSchema.save();
		} else {
			res.status(500).send('Internal Server Error'); // how did this happen? lol

			return;
		}

		res.json({
			Success: true,
			Message: 'Logged out',
		});
	},
);
