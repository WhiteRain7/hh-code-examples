<template>
    <div class="form-field-multichoice">
        <Multichoice
            :id="uuid + '-field-' + field.type"
            :options="field.options"
            :placeholder="field.placeholder"
            @change="value = $event; $parent.isValid()" />
    </div>
</template>


<script>/**
 * returns {@link Array}
 *
 * @typedef {Object} field
 *
 * @property {'multichoice'} type
 * @property {Array<{ _checked?: boolean, [key: string]: * }>} options
 * @property {boolean} [required=false]
 * @property {string} [placeholder]
 * @property {number} [min]
 * @property {number} [max]
 */

import { plural } from "~/plugins/scripts/utils"

export default {
    name: 'FormFieldMultichoice',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    components: {
        Multichoice: () => import('~/components/controls/Multichoice.vue'),
    },

    data () {
        return {
            value: this.field.options?.filter(i => i._checked) || [],
        }
    },

    methods: {
        clear () { this.value = this.field.options?.filter(i => i._checked) || [] },
        collectInitial () { return this.field.options?.filter(i => i._checked) },
        collect () { return this.value },

        isValid () {
            const checked = this.value.length
            const min = this.field.min ?? 0
            const max = this.field.max ?? this.field.options.length

            if (min && checked < min) {
                return (
                    `Должно быть выбрано от ${this.min} до ${this.max} `+
                    `значен${plural(['ия','ий','ий'],this.max)}, ` +
                    `сейчас ${checked}`
                )
            }

            if (max && checked > max) {
                return (
                    `Должно быть выбрано от ${this.min} до ${this.max} `+
                    `значен${plural(['ия','ий','ий'],this.max)}, ` +
                    `сейчас ${checked}`
                )
            }

            return true
        },

        isEmpty () { return this.value.length === 0 },
        onEmpty: () => 'Должно быть выбрано значение'
    }
}
</script>


<style scoped>
.form-field-multichoice :deep(li) {
    text-align: left;
}
</style>
