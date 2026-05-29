<template>
    <div class="form-container" role="form">
        <div ref="groupsContainer" class="form-group-containers">
            <div
                v-for="(group, index) in groups"
                :key="group.uuid"
                class="form-group-container"
                :style="`transform: translateX(${(index - activeGroup) * 100}%)`">

                <FormGroup ref="groups" :group="group" :inert="index !== activeGroup" />
            </div>
        </div>

        <menu class="form-menu">
            <li class="form-prev"><button @click="toPrevGroup()" class="form-button" :disabled="activeGroup === 0">{{ prev }}</button></li>
            <li class="form-next"><button @click="toNextGroup()" class="form-button" ref="next">{{ next }}</button></li>
            <li class="form-exit"><button @click="cancel()"      class="form-button">отмена</button></li>
        </menu>
    </div>
</template>


<script>
import { uuidv4, formatNumber, formatCoordinates } from '~/plugins/scripts/utils'

export default {
    name: 'FormContainer',

    props: [ 'fields' ],

    components: {
        FormGroup: () => import('./FormGroup')
    },

    data: function () {
        let groups = []

        if (Array.isArray(this.fields)) groups = this.fields

        else if (this.fields.fields) {
            groups = [ this.fields ]
        }

        else {
            groups.push({ name: null, fields: this.fields })
        }

        for (let group of groups) {
            group._changed = true
            group._createdDynamically = false
            group.uuid = uuidv4()
        }

        const prev = groups[0]?.prev ?? 'назад'
        const next = groups[0]?.next ?? 'далее'

        return {
            groups,

            activeGroup: 0,
            prev,
            next,

            listeners: {
                finish: [],
                close: [],
                cancel: [],
            },

            fromRemembered: {
                number: v => formatNumber(v),
                coords: v => formatCoordinates(v),
                multichoice: values => `<ul>\n<li>${values.map(v => v.name ?? v).join('</li>\n<li>')}</li>\n</ul>`,
                checkbox: v => v ? 'да' : 'нет',
                checkboxes: values => `${Object.values(values).filter(v => v).length} из ${Object.values(values).length}`,
            }
        }
    },

    mounted () {
        setTimeout(async () => {
            let i = 0
            while (i < this.groups.length) {
                const group = this.groups[i]

                if (group.skipFilled) {
                    for (const identifier in group.fields) {
                        if (group.fields[identifier].__vue__.isEmpty()) return
                    }

                    try { await this.toNextGroup() }
                    catch { return }
                }

                else return

                i++
            }
        }, 100)
    },

    methods: {
        clear () {
            for (const elem of this.$refs.groups) elem.clear()
        },
        collect () {
            let values = {}

            for (let i = 0; i < this.groups.length; i++) {
                let result = this.$refs.groups[i].collect()
                for (const key in result) values[key] = result[key]
            }

            return values
        },

        isValid () {
            for (const elem of this.$refs.groups) {
                if (!elem.isValid()) return false
            }

            return true
        },


        remembered (uuid) {
            let index = this.groups.findIndex(g => g.uuid === uuid)
            if (index === -1) return undefined

            let result = []

            for (let i = 0; i < index; i++) {
                for (const key in this.groups[i].fields) {
                    if (this.groups[i].fields[key].remember) {
                        const fromRemembered = this.fromRemembered[this.groups[i].fields[key].type] ?? (v => (v.name ?? v))

                        const value = this.groups[i].fields[key].__vue__?.collect() ?? ''

                        result.push({
                            name: this.groups[i].fields[key].name,
                            content: value ? fromRemembered(value) : '<span class="no-content-msg">не заполнено</span>'
                        })
                    }
                }
            }

            return result
        },


        _fail () {
            this.$refs.next.classList.add('cancelled')
            setTimeout(() => { this.$refs.next.classList.remove('cancelled') }, 1000)
        },

        toPrevGroup () {
            if (this.activeGroup > 0) {
                this.activeGroup--
                this.prev = this.groups[this.activeGroup].prev ?? 'назад'
                this.next = this.groups[this.activeGroup].next ?? 'далее'
            }
        },

        async toNextGroup () {
            let current = this.groups[this.activeGroup]
            let next = this.groups[this.activeGroup + 1] ?? null

            if (!current) return

            if (!this.$refs.groups[this.activeGroup].isValid()) return this._fail()

            if (!current._changed) { // if visited and no changes - go to
                this.activeGroup++
                this.prev = next.prev ?? 'назад'
                this.next = next.next ?? 'далее'
                return
            }

            else if (current.onNext) { // if dynamic next
                const result = await current.onNext(this.$refs.groups[this.activeGroup].getContext())

                if (!result) return this._fail() // if failed custom check

                else if (result === true) { // if checked
                    if (next !== null) {
                        current._changed = false
                        this.activeGroup++
                        this.prev = next.prev ?? 'назад'
                        this.next = next.next ?? 'далее'
                        return
                    }
                    else {
                        return this.finish()
                    }
                }

                else if (typeof result === 'object') {
                    if (!next) { // add to the end
                        this.groups.push(result)
                    }

                    else if (next._createdDynamically) { // kill branch and restart with new
                        let count = 0
                        for (let i = this.activeGroup + 1; i < this.groups.length; i++) {
                            if (!this.groups[i]._createdDynamically) break
                            count++
                        }
                        this.groups.splice(this.activeGroup + 1, count, result)
                    }

                    else { // insert just after current
                        this.groups.splice(this.activeGroup + 1, 0, result)
                    }

                    next = result

                    current._changed = false
                    this.activeGroup++
                    this.prev = next.prev ?? 'назад'
                    this.next = next.next ?? 'далее'
                    next._createdDynamically = true
                    next._changed = true
                    next.uuid = uuidv4()
                    return
                }
            }

            else {
                if (next !== null) {
                    current._changed = false
                    this.activeGroup++
                    this.prev = next.prev ?? 'назад'
                    this.next = next.next ?? 'далее'
                    return
                }
                else {
                    return this.finish()
                }
            }
        },


        cancel () {
            this.$emit('close')
            for (const callback of this.listeners.cancel) callback()
            for (const callback of this.listeners.close) callback()
        },

        finish () {
            const values = this.collect()
            this.$emit('finish', values)
            for (const callback of this.listeners.finish) callback(values)
            for (const callback of this.listeners.close) callback()
        },


        /**
         * @param {'cancel' | 'finish' | 'close'} event
         * @param {Function} callback
         */
        on (event, callback) {
            this.listeners[event].push(callback)
        },

        clearListeners (event = null) {
            if (event) this.listeners[event] = []
            else for (const event in this.listeners) this.listeners[event] = []
        },
    }
}
</script>


<style scoped>
.form-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    min-height: 85vh;
}

.form-group-containers {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
}

    .form-group-container {
        position: absolute;
        top: 0;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 10px;
        overflow-x: hidden;
        overflow-y: auto;
        transition: .4s;
        animation: form-group-appear .4s forwards;
    }
    .form-group-container::-webkit-scrollbar {
        width: 10px;
        background: #AAA;
    }
    .form-group-container::-webkit-scrollbar-thumb {
        width: 10px;
        background: var(--company-colour);
    }
    @keyframes form-group-appear {
        from { opacity: 0 }
    }

.form-menu {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    gap: 20px;
    box-sizing: border-box;
    width: 100%;
    padding: 10px;
    list-style: none;
}

    .form-menu > li {
        flex: 1;
        width: 400px;
        min-width: 100px;
        max-width: 100%;
    }
    .form-menu > li.form-next {
        flex: 2;
    }

        .form-button {
            box-sizing: border-box;
            width: 100%;
            padding: 10px 20px;
            border-radius: 6px;
            background: #666;
            color: #FFF;
            font-size: 16px;
            text-align: center;
            text-transform: lowercase;
            user-select: none;
            transition: .25s;
        }
        .form-button:hover {
            filter: brightness(1.1);
        }
        .form-button:disabled {
            opacity: .2;
            pointer-events: none;
        }

        .form-next .form-button {
            padding: 14px 20px;
            background: #008675;
            font-size: 18px;
        }
        .form-next .form-button.cancelled {
            pointer-events: none;
            background: #a52100;
            animation: next-shaking 1s ease-in-out forwards;
        }
        .form-exit .form-button {
            background: #a52100;
        }

        @keyframes next-shaking {
            from {}
             5% { transform: translateX(-5px ); }
            10% { transform: translateX( 10px); }
            15% { transform: translateX(-4px ); }
            20% { transform: translateX( 7px ); }
            25% { transform: translateX(-9px ); }
            30% { transform: translateX( 2px ); }
            35% { transform: translateX(-3px ); }
            40% { transform: translateX( 3px ); }
            45% { transform: translateX(0); }
            to  { transform: translateX(0); }
        }
</style>
