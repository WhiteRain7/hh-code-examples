<template>
    <div class="form-field-multiple">
        <Multiple
            :id="uuid + '-field-' + field.type"
            class="admin-input"
            :options="field.options"
            v-model="value"
            :placeholder="field.placeholder"
            @input="$parent.isValid()">
        </Multiple>
    </div>
</template>


<script>/**
 * returns {@link object}
 *
 * @typedef {Object} field
 *
 * @property {'multiple'} type
 * @property {Array<any> | Record<string, any>} options
 * @property {string} [placeholder]
 * @property {number} [min]
 * @property {number} [max]
 */
import { plural } from "~/plugins/scripts/utils";

export default {
    name: 'FormFieldSelect',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    components: {
        Multiple: () => import('~/components/controls/Multiple.vue'),
    },

    data () {
        return {
            value: this.$parent.resolveInitial()?.value,

            min: this.field.min || (this.field.required ? 1 : 0),
            max: this.field.max || Object.keys(this.field.options).length,
        }
    },

    methods: {
        clear () { this.value = this.$parent.resolveInitial()?.value },
        collectInitial () { return this.$parent.resolveInitial()?.value },
        collect () { return this.value },

        isValid () {
            const checked = this.value.length

            if (this.min && checked < this.min) {
                return (
                    `Должно быть выбрано от ${this.min} до ${this.max} `+
                    `пункт${plural(['','а','ов'],this.max)}, ` +
                    `но отмечено ${checked}`
                )
            }

            if (this.max && checked > this.max) {
                return (
                    `Должно быть выбрано от ${this.min} до ${this.max} `+
                    `пункт${plural(['','а','ов'],this.max)}, ` +
                    `но отмечено ${checked}`
                )
            }

            return true
        },
        isEmpty () { return !this.value?.length },
        onEmpty: () => 'Должно быть выбрано значение'
    }
}
</script>


<style scoped>
.form-field-select :deep(li) {
    text-align: left;
}
</style>
