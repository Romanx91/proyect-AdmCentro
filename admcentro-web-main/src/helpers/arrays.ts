export const removeDuplicates = (arr: [], key: string) => {
    return arr.filter((obj, index, self) => index === self.findIndex((t) => t[key] === obj[key]));
};

export const sortArrayByNumericKey = (array: any, key: string) => {
    return array.sort((a: any, b: any) => a[key] - b[key!]);
};