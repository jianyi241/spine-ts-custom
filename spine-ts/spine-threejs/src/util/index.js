export * from  "./LodashHelper.js";

export const arrayLikeToArray = (input, limitLength) => {
    if (Array.isArray(input)) {
        return input;
    }
    if (Symbol.iterator in Object(input)) {
        return (function (inputIterable, limitLength) {
            const result = [];
            let isIteratorComplete = true;
            let hasIteratorError = false;
            let iteratorError;
            try {
                for (let iteratorItem of inputIterable[Symbol.iterator]()) {
                    result.push(iteratorItem);
                    if (limitLength && result.length === limitLength) {
                        break;
                    }
                    isIteratorComplete = true;
                }
            } catch (error) {
                hasIteratorError = true;
                iteratorError = error;
            } finally {
                try {
                    if (!isIteratorComplete && inputIterable.return) {
                        inputIterable.return();
                    }
                } finally {
                    if (hasIteratorError) {
                        throw iteratorError;
                    }
                }
            }
            return result;
        })(input, limitLength);
    }
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
};
