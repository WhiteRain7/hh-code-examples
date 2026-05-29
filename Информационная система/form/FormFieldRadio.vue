<template>
    <div>
        <div v-if="field.nullable !== false" class="admin-radio">
            <input
                :id="uuid + '-field-null-' + field.type"
                class="admin-radio-input"
                type="radio"
                :name="uuid + '-field-null-' + field.type"
                :checked="value === null"
                @change="value = null; $parent.isValid();"/>

            <label
                :for="uuid + '-field-null-' + field.type"
                class="admin-radio-label no-content-msg">

                {{ field.placeholder || 'не выбрано' }}
            </label>
        </div>

        <div v-for="(option, key) in field.options" class="admin-radio">
            <input
                :id="uuid + '-field-' + field.type + '-' + key"
                class="admin-radio-input"
                type="radio"
                :name="uuid + '-field-' + field.type"
                :checked="value === key"
                @change="value = key; $parent.isValid();"/>

            <label
                :for="uuid + '-field-' + field.type + '-' + key"
                class="admin-radio-label">

                {{ option?.name ?? option }}
            </label>
        </div>
    </div>
</template>


<script>
/**
 * returns {@link object}
 *
 * @typedef {Object} field
 *
 * @property {'radio'} type
 * @property {Array<any> | Record<string, any>} options
 * @property {string} [placeholder]
 * @property {boolean} [nullable=true]
 * @property {'key' | 'value' | 'all'} [expect='value']
 */

export default {
    name: 'FormFieldRadio',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data: function () {
        return {
            value: this.$parent.resolveInitial()?.key
        }
    },

    methods: {
        clear () { this.value = this.$parent.resolveInitial()?.key },
        collectInitial () {
            let ini = this.$parent.resolveInitial()

            switch (this.field.expect) {
                case 'key': return ini?.key
                case 'all': return ini
                case 'value':
                default: return ini?.value
            }
        },
        collect () {
            switch (this.field.expect) {
                case 'key': return this.value
                case 'all': return { key: this.value, value: this.field.options[this.value] }
                case 'value':
                default: return this.field.options[this.value]
            }
        },

        isEmpty () { return !(this.value in this.field.options) },
        onEmpty: () => 'Один из пунктов должен быть выбран'
    }
}
</script>


<style scoped>
</style>
