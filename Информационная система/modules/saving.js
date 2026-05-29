import { debounce } from 'lodash'
import Vue from 'vue'

// for vue elements - this.$saving
export default (context) => {
    const saving = new Saving(context)

    if (context.$modules == undefined) context.$modules = {}
    context.$modules.saving = saving

    Object.defineProperty(Vue.prototype, '$saving', { get: () => saving })
}


/**
 * @typedef {(affected : number | string | undefined, fields: '*' | Set<string>) => boolean} saver
 */

/**
 * @typedef {Object} ChangeEntry
 *
 * @property {'*' | string} field - what is changed
 * @property {number | string} [affected] - id of changed entity
 * @property {string | saver} resolver - bound resolver key or function
 * @property {HTMLElement} [el] - input element to indicate status
 */

/**
 * @typedef {Object} ChangeResolver
 *
 * @property {() => Promise<boolean>} f
 * @property {HTMLElement[]} els
 */

export class Saving {
    /** @type {any} */
    context = null

    /** @type {ChangeEntry[]} */
    changes = []

    /** @type {Map<string, saver>} */
    bindings = new Map

    /** @type {boolean} */
    saving = false

    /** reserved for future use */
    serializers = new Map

    constructor (context) {
        this.context = context
        this.context.app.router.beforeEach((to, from, next) => {
            if (this.saving) {
                this.context.$modules.notifications?.notify(
                    'Сохранение не завершено',
                    {
                        state: 'warning',
                        closeAfter: 3000
                    }
                )
                this.saving = false
            }
            else {
                this.bindings.clear()
                this.serializers.clear()
                next()
            }
        })
    }

    // deprecated and replaced with clearing bindings on page navigation
    // get _path () {
    //     return this.context.app.router.currentRoute.path
    // }

    /**
     * @param {string | saver} resolver
     * @param {string | number | undefined} [affected=undefined]
     * @param {'*' | string} [field='*']
     */
    set (resolver, affected = undefined, field = '*') {
        const last = this.changes[this.changes.length - 1]

        if (
            last &&
            last.resolver === resolver &&
            last.affected === affected &&
            last.field    === field
        ) return this.save()

        this.changes.push({ resolver, affected, field })
        this.save()
    }

    /** @param {ChangeEntry} entry */
    addEntry (entry) {
        const last = this.changes[this.changes.length - 1]

        if (
            last && (
                last.el &&
                last.el === entry.el
                ||
                last.resolver === entry.resolver &&
                last.affected === entry.affected &&
                last.field    === entry.field
            )
        ) return this.save()

        entry.el?.classList.remove('saving-success', 'saving-failure')
        if (!('savedim' in entry.el?.dataset)) entry.el?.classList.add('saving-change')

        this.changes.push(entry)
        this.save()
    }

    cancel (key) {
        this.changes = this.changes.filter(change => change.resolver !== key)
    }

    /**
     * @param {string} key
     * @param {saver} callback
     * @param {Function} [serializer]
     */
    bind (key, callback, serializer = undefined) {
        this.bindings.set(key, callback)
        if (serializer) this.serializers.set(key, serializer)
    }

    unbind (key) {
        this.bindings.delete(key)
        this.serializers.delete(key)
    }

    async applySave () {
        if (!this.changes.length) return
        const notifications = this.context.$modules.notifications

        let changes = this.changes
        this.changes = []

        const notid = notifications?.notify('Подготовка к сохранению...', { state: 'loading' })

        let functions = unify(changes, this)

        let errors = await resolve(functions, this, (i, len) => {
            notifications?.setText(notid, `Сохранение ${i}/${len}`)
        })

        if (errors.length === functions.length) {
            notifications?.setState(notid, 'error')
            notifications?.setText(notid, `Ошибка сохранения`)
        } else if (errors.length) {
            notifications?.setState(notid, 'warning')
            notifications?.setText(notid, `Сохранено с ошибками (${errors.length}/${functions.length})`)
        } else {
            notifications?.setState(notid, 'success')
            notifications?.setText(notid, `Сохранено успешно`)
        }
        await notifications?.close(notid, 2000)

        this.saving = false
    }

    _save = debounce(
        async () => await this.applySave(),
        1000
    )

    save () {
        this.saving = true
        this._save()
    }


    /**
     * @param {Vue} vue
     * @param {string} methods
     */
    wrap (vue, ...methods) {
        let notifications = this.context.$modules.notifications

        for (let method of methods) {
            let original = vue[method]
            vue[method] = async (...args) => {
                let notid = notifications?.notify('Сохранение...', { state: 'loading' })

                try {
                    let data = await original(...args)
                    notifications?.setText(notid, 'Сохранено')
                    notifications?.setState(notid, 'success')
                    notifications?.close(notid, 2000)
                    return data
                }
                catch (e) {
                    notifications?.setState(notid, 'error')
                    notifications?.setText(notid, 'Ошибка сохранения')
                    notifications?.close(notid, 2000)
                }
            }
        }
    }

    /**
     * @param {Vue} vue
     * @param {string} methods
     */
    wrapEnd (vue, ...methods) {
        let notifications = this.context.$modules.notifications

        for (let method of methods) {
            let original = vue[method]
            vue[method] = async (...args) => {
                try {
                    let data = await original(...args)
                    if (data !== false) notifications?.notify('Сохранено', { state: 'success', closeAfter: 2000 })
                    return data
                }
                catch {
                    notifications?.notify('Ошибка сохранения', { state: 'error', closeAfter: 2000 })
                }
            }
        }
    }
}



/**
 * @param {ChangeEntry[]} changes
 * @param {Saving} saving
 * @returns {Array<ChangeResolver>}
 */
function unify (changes, saving) {
    /** @type {Array<ChangeResolver>} */
    let resolvers = []

    /** @type {Record<string, Record<string, { fields: Set<string>, elements: HTMLElement[] }>>} */
    let sorted = {}

    for (let change of changes) {
        let resolver = change.resolver
        let affected = String(change.affected)

        if (typeof resolver === 'function') {
            resolvers.push({
                f: async () => resolver(change.affected, new Set([ change.field ])),
                els: change.el ? [ change.el ] : []
            })

            continue
        }

        if (!sorted[resolver]) {
            sorted[resolver] = {}
        }
        if (!sorted[resolver][affected]) {
            sorted[resolver][affected] = {
                fields: new Set,
                elements: [],
            }
        }

        sorted[resolver][affected].fields.add(change.field)
        if (change.el) sorted[resolver][affected].elements.push(change.el)
    }

    resolvers.push(...toResolvers(sorted, saving))

    return resolvers
}

/**
 * @param {Record<string, Record<string, { fields: Set<string>, elements: HTMLElement[] }>>} sorted
 * @param {Saving} saving
 * @returns {Array<ChangeResolver>}
 */
function toResolvers (sorted, saving) {
    let resolvers = []

    for (let resolver in sorted) {
        for (let affected in sorted[resolver]) {
            let fields = sorted[resolver][affected].fields.has('*') ?
                '*' :
                sorted[resolver][affected].fields

            resolvers.push({
                f: () => saving.bindings.get(resolver)(affected, fields),
                els: sorted[resolver][affected].elements
            })
        }
    }

    return resolvers
}

/**
 * @param {ChangeResolver[]} functions
 * @param {Saving} saving
 * @param {(i : number, len : number) => void} [onProgress=null]
 * @returns {Promise<ChangeResolver[]>}
 */
async function resolve (functions, saving, onProgress = null) {
    let errors = []
    let i = 0

    for (let f of functions) {
        onProgress?.(i, functions.length)

        let success = true
        try { success = await f.f() }
        catch (e) { success = false; console.log(e) }

        f.els.forEach(el => el.dispatchEvent(new CustomEvent('autosave', { detail: success })))

        if (success === false) {
            f.els?.forEach(el => {
                el.classList.remove('saving-change')
                if (!('savedim' in el.dataset)) el.classList.add('saving-failure')
            })
            errors.push(f)
        } else {
            f.els?.forEach(el => {
                el.classList.remove('saving-change')
                if (!('savedim' in el.dataset)) el.classList.add('saving-success')
            })
        }

        i ++
    }

    return errors
}
