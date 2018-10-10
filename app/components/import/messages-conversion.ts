import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';
import {ImportErrors} from '../../core/import/import-errors';
import {isArray} from 'tsfun';


/**
 * Converts messages of Validator / Importer to messages of M for ImportComponent.
 *
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: string[]): string[] {

        if (!isArray(msgWithParams)) {
            console.warn('convertMessage. arg not of type array', msgWithParams);
            return [];
        }

        if (msgWithParams.length === 0) return [];
        let replacement = undefined;
        const msg = msgWithParams[0];


        if (msg === ValidationErrors.INVALID_TYPE) replacement = M.IMPORT_VALIDATION_ERROR_INVALID_TYPE;
        if (msg === ValidationErrors.NO_ISRECORDEDIN) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN;
        if (msg === ValidationErrors.NO_ISRECORDEDIN_TARGET) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET;
        if (msg === ValidationErrors.IDENTIFIER_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS;
        if (msg === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_ERROR_MISSING_PROPERTY;
        if (msg === ValidationErrors.MISSING_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE;
        if (msg === ValidationErrors.MISSING_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES;
        if (msg === ValidationErrors.INVALID_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES;
        if (msg === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;
        if (msg === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;

        if (msg === ImportErrors.FILE_UNREADABLE) replacement = M.IMPORT_ERROR_FILE_UNREADABLE;
        if (msg === ImportErrors.FILE_INVALID_JSON) replacement = M.IMPORT_ERROR_INVALID_JSON;
        if (msg === ImportErrors.FILE_INVALID_JSONL) replacement = M.IMPORT_ERROR_INVALID_JSONL;
        if (msg === ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT) replacement = M.IMPORT_ERROR_INVALID_GEOJSON_IMPORT_STRUCT;
        if (msg === ImportErrors.MISSING_IDENTIFIER) replacement = M.IMPORT_ERROR_MISSING_IDENTIFIER;
        if (msg === ImportErrors.WRONG_IDENTIFIER_FORMAT) replacement = M.IMPORT_ERROR_IDENTIFIER_FORMAT;
        if (msg === ImportErrors.INVALID_CSV) replacement = M.IMPORT_ERROR_INVALID_CSV;
        if (msg === ImportErrors.GENERIC_CSV_ERROR) replacement = M.IMPORT_ERROR_GENERIC_CSV_ERROR;
        if (msg === ImportErrors.MANDATORY_CSV_FIELD_MISSING) replacement = M.IMPORT_ERROR_MANDATORY_CSV_FIELD_MISSING;

        if (msg === ImportErrors.GENERIC_DATASTORE_ERROR) replacement = M.IMPORT_ERROR_GENERIC_DATASTORE_ERROR;
        if (msg === ImportErrors.INVALID_GEOMETRY) replacement = M.IMPORT_ERROR_INVALID_GEOMETRY;
        if (msg === ImportErrors.ROLLBACK_ERROR) replacement = M.IMPORT_ERROR_ROLLBACK_ERROR;
        if (msg === ImportErrors.MISSING_RESOURCE) replacement = M.IMPORT_ERROR_MISSING_RESOURCE;
        if (msg === ImportErrors.MISSING_RELATION_TARGET) replacement = M.IMPORT_ERROR_MISSING_RELATION_TARGET;
        if (msg === ImportErrors.INVALID_MAIN_TYPE_DOCUMENT) replacement = M.IMPORT_ERROR_INVALID_OPERATION_RESOURCE;
        if (msg === ImportErrors.OPERATIONS_NOT_ALLOWED_ON_IMPORT_TO_OPERATION) replacement = M.IMPORT_ERROR_OPERATIONS_NOT_ALLOWED;
        if (msg === ImportErrors.NO_OPERATION_ASSIGNABLE) replacement = M.IMPORT_ERROR_NO_OPERATION_ASSIGNABLE;
        if (msg === ImportErrors.NO_FEATURE_ASSIGNABLE) replacement = M.IMPORT_ERROR_NO_FEATURE_ASSIGNABLE;


        if (msg === ValidationErrors.INVALID_FIELDS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_FIELD
        }
        if (msg === ValidationErrors.INVALID_RELATIONS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD
        }
        if (msg === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE
        }

        if (replacement) (msgWithParams as any)[0] = replacement;
        return msgWithParams;
    }
}