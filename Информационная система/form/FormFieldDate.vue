<template>
    <div>
        <input
            :id="uuid + '-field-' + field?.type"
            class="admin-input"
            type="date"
            v-model="value"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :title="field.placeholder"
            @input="$parent.isValid()"
        />
    </div>
</template>


<script>
/**
 * returns {@link Date}
 *
 * @typedef {Object} field
 *
 * @property {'date'} type
 * @property {string} [initial]
 * @property {string} [min]
 * @property {string} [max]
 * @property {number | string} [step='1']
 * @property {string} [placeholder]
 */

import { formatDate } from '~/plugins/scripts/utils'

export default {
    name: 'FormFieldDate',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data() {
        return {
            value: this.setDate(this.field.initial) || '', //this.setInitialDate() || '',
            min: this.field.min || '',
            max: this.field.max || '',
            step: this.field.step || '1',
        };
    },

    methods: {
        clear () {
            this.value = this.setDate(this.value) || null
        },
        collectInitial() {
            return new Date(this.setDate(this.value))
        },
        collect() {
            return new Date(this.value)
        },

        isValid() {
            if (this.min && this.setDate(this.value) < this.setDate(this.min)) {
                return `Выберите дату не раньше ${formatDate(this.min, 'dd ofmonth yyyy')}`
            }

            if (this.max && this.setDate(this.value) > this.setDate(this.max)) {
                return `Выберите дату не позднее ${formatDate(this.max, 'dd ofmonth yyyy')}`
            }

            return true
        },
        isEmpty() {
            return !this.value
        },
        onEmpty: () => 'Вы должны указать дату',

        setDate (date) {
            if (date instanceof Date) {
                var dateInit = date
                var Y, M, D,
                    Y = dateInit.getFullYear()
                var month = dateInit.getMonth() + 1
                var dates = dateInit.getDate()

                if (month < 10) M = '0' + month
                if (dates < 10) D = '0' + dates

                return String(`${Y}-${M || month}-${D || dates}`)
            }
            else if (typeof date === "string") {
                var Y, M, D
                var dateTimeGet = date.split(/[\- :T]+/)
                Y = dateTimeGet[0]
                M = dateTimeGet[1] < 10 && dateTimeGet[1].length < 2 ? '0' + dateTimeGet[1] : dateTimeGet[1]
                D = dateTimeGet[2] < 10 && dateTimeGet[2].length < 2 ? '0' + dateTimeGet[2] : dateTimeGet[2]
                return String(`${Y}-${M}-${D}`)
            }
        }
    },
};
</script>



