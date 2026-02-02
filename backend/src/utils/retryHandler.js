/**
 * Retry Handler Utility
 * Implements exponential backoff for failed operations
 */

class RetryHandler {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.baseDelay = options.baseDelay || 1000; // 1 second
        this.maxDelay = options.maxDelay || 30000; // 30 seconds
        this.exponentialBase = options.exponentialBase || 2;
    }

    /**
     * Execute a function with retry logic
     * @param {Function} fn - Async function to execute
     * @param {Object} context - Context for logging
     * @returns {Promise} Result of the function
     */
    async execute(fn, context = {}) {
        let lastError;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await fn();

                if (attempt > 0) {
                    console.log(`✅ Retry successful on attempt ${attempt + 1}`, context);
                }

                return result;
            } catch (error) {
                lastError = error;

                if (attempt < this.maxRetries) {
                    const delay = this.calculateDelay(attempt);
                    console.log(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, {
                        ...context,
                        error: error.message
                    });

                    await this.sleep(delay);
                }
            }
        }

        console.error(`❌ All ${this.maxRetries + 1} attempts failed`, {
            ...context,
            error: lastError.message
        });

        throw lastError;
    }

    /**
     * Calculate delay with exponential backoff
     * @param {number} attempt - Current attempt number
     * @returns {number} Delay in milliseconds
     */
    calculateDelay(attempt) {
        const delay = this.baseDelay * Math.pow(this.exponentialBase, attempt);
        return Math.min(delay, this.maxDelay);
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Retry wrapper for database operations
 */
async function retryDatabaseOperation(operation, context = {}) {
    const retryHandler = new RetryHandler({
        maxRetries: 3,
        baseDelay: 500,
        maxDelay: 5000
    });

    return retryHandler.execute(operation, {
        type: 'database',
        ...context
    });
}

/**
 * Retry wrapper for external API calls
 */
async function retryApiCall(apiCall, context = {}) {
    const retryHandler = new RetryHandler({
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 30000
    });

    return retryHandler.execute(apiCall, {
        type: 'api',
        ...context
    });
}

/**
 * Retry wrapper for file operations
 */
async function retryFileOperation(fileOp, context = {}) {
    const retryHandler = new RetryHandler({
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000
    });

    return retryHandler.execute(fileOp, {
        type: 'file',
        ...context
    });
}

module.exports = {
    RetryHandler,
    retryDatabaseOperation,
    retryApiCall,
    retryFileOperation
};
