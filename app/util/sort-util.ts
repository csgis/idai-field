/**
 * Implements utility methods for sorting
 *
 * @author Sebastian Cuy
 */
export class SortUtil {

    /**
     * Compares two string alphanumerically so that
     * numerical portions of strings are treated as numbers.
     *
     * @param a a string
     * @param b another string
     * @returns {number} -1 if a < b, 1 if a > b, 0 if a == b
     */
    public static alnumCompare(a, b): number {

        let arrayA = this.makeAlNumArray(a);
        let arrayB = this.makeAlNumArray(b);

        for (let i=0; i < arrayA.length; i++) {
            // a is longer than b
            if (i >= arrayB.length) return 1;
            if (typeof arrayA[i] == 'number') {
                // both elements are numbers
                if (typeof arrayB[i] == 'number') {
                    if (arrayA[i] > arrayB[i]) return 1;
                    if (arrayA[i] < arrayB[i]) return -1;
                // a is number, b is string
                } else {
                    return -1;
                }
            } else {
                // both elements are strings
                if (typeof arrayB[i] == 'string') {
                    let cmp =  arrayA[i].localeCompare(arrayB[i]);
                    if (cmp > 0) return 1;
                    if (cmp < 0) return -1;
                // a is string b is number
                } else {
                    return 1;
                }
            }
            // so far, a and b are equal -> continue with next array element
        }
        // b is longer than a
        if (arrayB.length > arrayA.length) return -1;
        // a and b are equal
        return 0;
    }

    /**
     * Compares two objects with standard comparison operators.
     *
     * @param a
     * @param b
     * @returns {number}
     */
    public static compare(a, b): number {
        if (a > b)
            return 1;
        if (a < b)
            return -1;
        return 0;
    }

    /**
     * Wraps a compare function in order to be able to sort an array of objects
     * by the contents of one particular field.
     *
     * @param sortField The field to sort by
     * @param compareFunction the compare function to wrap
     * @returns {(a:any, b:any)=>any} the new compare function
     */
    public static compareField(sortField, compareFunction) {

        return (a, b) => {
            return compareFunction(a[sortField], b[sortField]);
        };
    }

    /**
     * Wraps a compare function in order to reverse sorting.
     *
     * @param compareFunction the compare function to wrap
     * @returns {(a:any, b:any)=>number} the new compare function
     */
    public static compareDescending(compareFunction) {

        return (a, b) => {
            return compareFunction(a, b) * -1;
        };
    }

    // split string and convert numbers to be able to sort alphabetic
    // and numeric parts of the string separately
    private static makeAlNumArray(s) {
        return s.split(/(\d+)/)
            .map(s => /^\d+$/.test(s) ? parseInt(s) : s);
    }

}