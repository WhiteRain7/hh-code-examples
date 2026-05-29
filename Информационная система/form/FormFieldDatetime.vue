<template>
    <div>
        <input
            :id="uuid + '-field-' + field?.type"
            class="admin-input"
            type="datetime-local"
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
 * @property {'datetime'} type
 * @property {string} [initial]
 * @property {string} [min]
 * @property {string} [max]
 * @property {number | string} [step='1']
 * @property {string} [placeholder]
 */

import { formatDate } from '~/plugins/scripts/utils'

export default {
    name: 'FormFieldDatetime',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data() {
        return {
            value: this.setDate(this.field.initial) || '',
            min: this.field.min || '',
            max: this.field.max || '',
            step: this.field.step || '1',
        };
    },

    methods: {
        clear() {
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
                return `Выберите дату и время не раньше ${formatDate(this.setDate(this.min), 'dd ofmonth yyyy HH:MM')}`
            }

            if (this.max && this.setDate(this.value) > this.setDate(this.max)) {
                return `Выберите дату и время не позднее ${formatDate(this.setDate(this.max), 'dd ofmonth yyyy HH:MM')}`
            }

            return true
        },
        isEmpty() {
            return !this.value
        },
        onEmpty: () => 'Вы должны указать дату и время',
        setDate(date) {
            if (date instanceof Date) {
                var dateInit = date
                var Y, M, D, H, MM
                Y = dateInit.getFullYear()
                var month = dateInit.getMonth() + 1
                var dates = dateInit.getDate()
                var hours = dateInit.getHours()
                var minutes = dateInit.getMinutes()
                if (month < 10) M = '0' + month
                if (dates < 10) D = '0' + dates
                if (hours < 10) H = '0' + hours
                if (minutes < 10) MM = '0' + minutes
                return String(`${Y}-${M || month}-${D || dates} ${H || hours}:${MM || minutes}`)
            } else if (typeof date === "string") {
                var Y, M, D, H, MM
                var dateTimeGet = date.split(/[\- :T]+/)
                Y = dateTimeGet[0]
                M = dateTimeGet[1] < 10 && dateTimeGet[1].length < 2 ? '0' + dateTimeGet[1] : dateTimeGet[1]
                D = dateTimeGet[2] < 10 && dateTimeGet[2].length < 2 ? '0' + dateTimeGet[2] : dateTimeGet[2]
                H = dateTimeGet[3] < 10 && dateTimeGet[3].length < 2 ? '0' + dateTimeGet[3] : dateTimeGet[3]
                MM = dateTimeGet[4] < 10 && dateTimeGet[4].length < 2 ? '0' + dateTimeGet[4] : dateTimeGet[4]
                return String(`${Y}-${M}-${D}${H ? ' ' + H + ':' + MM : ' 00:00'}`)
            }
        }
    }
};
</script>


<style>

</style>
