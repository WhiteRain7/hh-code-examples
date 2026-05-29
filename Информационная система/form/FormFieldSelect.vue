<template>
    <div class="form-field-select">
        <Dropdown
            :id="uuid + '-field-' + field.type"
            class="admin-input"
            v-model="value"
            :placeholder="field.placeholder || 'Выберите вариант'"
            arrow="v-24"
            @input="$parent.isValid()">

            <li v-for="(option, key) of field.options" :key="key" v-value="option" :style="{ background: option.$bg, color: option.$fg }">
                <template v-if="option?.__nested__">
                    <ul :label="key">
                        <li v-for="(suboption, subkey) of option.__nested__" :key="key + '/' + subkey" v-value="suboption">
                            {{ suboption?.name ?? suboption }}
                        </li>
                    </ul>
                </template>

                <template v-else>{{ option?.name ?? option }}</template>
            </li>
        </Dropdown>
    </div>
</template>


<script>
/**
 * returns {@link object}
 *
 * @typedef {Object} field
 *
 * @property {'select'} type
 * @property {Array<any> | Record<string, any>} options
 * @property {string} [placeholder]
 */

export default {
    name: 'FormFieldSelect',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    components: {
        Dropdown: () => import('~/components/controls/Dropdown.vue'),
    },

    data () {
        return {
            value: this.$parent.resolveInitial()?.value,
        }
    },

    methods: {
        clear () { this.value = this.$parent.resolveInitial()?.value },
        collectInitial () { return this.$parent.resolveInitial()?.value },
        collect () { return this.value },

        isEmpty () { return this.value == null },
        onEmpty: () => 'Должно быть выбрано значение'
    }
}
</script>


<style scoped>
.form-field-select :deep(li) {
    text-align: left;
}
</style>
