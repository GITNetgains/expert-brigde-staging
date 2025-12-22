/**
 * @apiDefine authRequest
 * @apiHeader {String}    Authorization       Authorization token
 * @apiHeaderExample {json} Example:
 *     {
 *       "Authorization": "Bearer abcxyz1234"
 *     }
 */

/**
 * @apiDefine paginationQuery
 * @apiQuery {Number} [take] total items will be responsed
 * @apiQuery {Number} [page]
 * @apiQuery {String} [sort] Sort field. Eg `createdAt`
 * @apiQuery {String} [sortType] `desc` or `asc`
 */
