export function routeOne(props: { one: number }): never {
	console.log(props);
	// @ts-expect-error this is just a plug
	return ['text', {} as never];
}
