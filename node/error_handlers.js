const { standardRes } = require('./utils');

/**
 * Checks if the givens values are not undefined
 * @param res: express response
 * @param params_values: list of required params values to check
 */
let requiredParametersErrHandler = (res, params_values) => {
    console.log(params_values.filter(param => !param).length);
    if (params_values.filter(param => !param).length) return standardRes(res, 422, "Parametri mancanti.");
    return true;
};

/**
 * Returns an error if err is not undefined
 * @param res: express response
 * @param err: error
 * @param message: message to append to standardRes error
 */
let errHandler = (res, err, message, is_find_error = true, status = 500) => {
    if (err) {
        console.log(err);

        return standardRes(res, status, (is_find_error)? "Errore nella ricerca di " + message + "." : message);
    }

    return true;
};

exports.requiredParametersErrHandler = requiredParametersErrHandler;
exports.errHandler = errHandler;