import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import { VerificationFlags } from '../../../Constants.js';
import Encryption from '../../../Utils/Classes/Encryption.js';
import LinkGeneration from '../../../Utils/Classes/LinkGeneration.js';
import { VerifcationLinkSchema } from '../../../Utils/Schemas/Schemas.js';

new Route('/validate', 'POST', [], async (req, res) => {
	const { code }: { code: string } = req.body;

	if (!code) {
		const MissingCode = new HTTPErrors(4_019);

		MissingCode.AddError({
			Code: {
				Code: 'MissingOrInvalidCode',
				Message: 'Missing or invalid code2',
			},
		});

		res.status(400).json(MissingCode.toJSON());

		return;
	}

	console.log(LinkGeneration.GetSnowflake(code));

	const Link = await VerifcationLinkSchema.findOne({
		_id: Encryption.encrypt(LinkGeneration.GetSnowflake(code) as string),
		Code: Encryption.encrypt(code),
		Ip: Encryption.encrypt(req.clientIp),
		Flags: VerificationFlags.VerifyEmail,
	});

	if (!Link) {
		const InvalidCode = new HTTPErrors(4_019);

		InvalidCode.AddError({
			Code: {
				Code: 'MissingOrInvalidCode',
				Message: 'Missing or invalid code1',
			},
		});

		res.status(400).json(InvalidCode.toJSON());

		return;
	}

	if (Link.ExpireDate < Date.now()) {
		const ExpiredCode = new HTTPErrors(4_100);

		ExpiredCode.AddError({
			Code: {
				Code: 'ExpiredCode',
				Message: 'Expired code',
			},
		});

		res.status(400).json(ExpiredCode.toJSON());

		return;
	}

	res.json({
		Valid: true,
		LinkedUser: Encryption.decrypt(Link.User),
	});
});
