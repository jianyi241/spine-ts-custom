export class LodashHelper {
    static fromEntries(iterable) {
        return [...iterable].reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});
    }
}
