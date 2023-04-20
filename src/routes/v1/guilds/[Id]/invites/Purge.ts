import { Route } from '@kastelll/core';
import User from '../../../../../Middleware/User';

new Route(
	'/purge',
	'DELETE',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
		}),
	],
	async (req, res) => {},
);
