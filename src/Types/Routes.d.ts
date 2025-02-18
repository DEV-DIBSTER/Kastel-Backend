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

import type { Flags } from '../Constants.js';

export type Methods =
	| 'ALL'
	| 'all'
	| 'DELETE'
	| 'delete'
	| 'GET'
	| 'get'
	| 'HEAD'
	| 'head'
	| 'OPTIONS'
	| 'options'
	| 'PATCH'
	| 'patch'
	| 'POST'
	| 'post'
	| 'PURGE'
	| 'purge'
	| 'PUT'
	| 'put';

export interface UserMiddleware {
	// The flags required to access the endpoint (Default: null)
	// If you need to be logged in to access the endpoint
	AccessType: 'All' | 'LoggedIn' | 'LoggedOut';
	AllowedRequesters: 'All' | 'Bot' | 'User';
	DisallowedFlags?: (keyof typeof Flags)[];
	// The type of user that can access the endpoint (Default: 'All')
	Flags?: (keyof typeof Flags)[]; // The flags that are not allowed to access the endpoint (Default: null)
}

interface RateLimitObjectItem {
	date: number;
	increment: number;
}

interface RateLimitObject {
	id: string;
	increment: number;
	lastRequest: number;
	method: Methods;
	regex: string;
	requests: RateLimitObjectItem[];
}

interface RequestOptions {
	max?: number;
	reset?: number;
}

interface FlagOptions {
	bypass: boolean;
	flag: number;
}

interface Options {
	flags: FlagOptions[];
	requests: RequestOptions;
}

export interface Captcha {
	// The expected cdata of the captcha (done client side) (session id stuffs)
	BodyTrigger?: string[];
	Enabled: boolean;
	// If the captcha is enabled
	ExpectedAction?: string;
	// The expected action of the captcha (login, register, etc.) (done client side)
	ExpectedCData?: string; // The body key that triggers the captcha (like the username field or password field etc)
}
