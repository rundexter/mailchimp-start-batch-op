var request = require('request'),
    _ = require('lodash'),
    util = require('./util'),
    pickInputs = {
        method: 'method',
        path: 'path',
        params: 'params',
        body: 'body',
        operation_id: 'operation_id'
    }, pickOutputs = {
        'id': 'id',
        'status': 'status',
        'errored_operations': 'errored_operations',
        'submitted_at': 'submitted_at',
        'completed_at': 'completed_at',
        'response_body_url': 'response_body_url'
    };

module.exports = {
    authOptions: function (dexter) {
        if (!dexter.environment('mailchimp_api_key') || !dexter.environment('server')) {
            this.fail('A [mailchimp_api_key] and [server] environment variables are required for this module');
            return false;
        } else {
            return {
                api_key: dexter.environment('mailchimp_api_key'),
                server: dexter.environment('server')
            }
        }
    },
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var auth = this.authOptions(dexter),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        if (!auth) return;

        if (validateErrors)
            return this.fail(validateErrors);

        request({
            method: 'POST',
            baseUrl: 'https://' + auth.server + '.api.mailchimp.com/3.0/',
            uri: '/batches',
            body: { operations: [inputs] },
            json: true,
            auth: {
                username: 'api_key',
                password: auth.api_key
            }
        },
        function (error, response, body) {
            if (!error && (response.statusCode === 200 || response.statusCode === 204)) {
                this.complete(util.pickOutputs(body, pickOutputs));
            } else {
                this.fail(error || body);
            }
        }.bind(this));
    }
};
