<template>
    <section class="calendar-input">
        <header class="calendar-input-header layout-horizontal">
            <button type="button" class="inline-button bg-option" @click="choseYear">
                {{ this.year }}
            </button>

            <button type="button" class="inline-button bg-option expandable" @click="choseMonth">
                {{ DateNames.months[this.month] }}
            </button>

            <button type="button" class="icon-button bg-option" title="Предыдущий месяц" @click="prev">
                <Icon source="arrowN" :size="20" />
            </button>
            <button type="button" class="icon-button bg-option" title="Следующий месяц" @click="next">
                <Icon source="arrowS" :size="20" />
            </button>
        </header>

        <table class="calendar-input-table" :inert="mode === 'day' ? null : 'true'">
            <thead><tr>
                <th scope="col" title="Понедельник">П</th>
                <th scope="col" title="Вторник"    >В</th>
                <th scope="col" title="Среда"      >С</th>
                <th scope="col" title="Четверг"    >Ч</th>
                <th scope="col" title="Пятница"    >П</th>
                <th scope="col" title="Суббота"    >С</th>
                <th scope="col" title="Воскресенье">В</th>
            </tr></thead>

            <tbody>
                <tr v-for="week in days">
                    <template v-for="day in week.days">
                        <td
                            v-if="day"
                            :title="eventsOn(from(year, month, day)) ? `событий в этот день: ${eventsOn(from(year, month, day))}` : null"
                            class="calendar-input-day-cell"
                            :class="{
                                active: from(year, month, day) === value_,
                                events: !!eventsOn(from(year, month, day)),
                                today: from(year, month, day) === today
                            }">

                            <button
                                type="button"
                                tabindex="0"
                                @click="value_ = from(year, month, day)">

                                {{ day ?? '' }}
                            </button>
                        </td>
                        <td v-else class="disabled"></td>
                    </template>
                </tr>
            </tbody>
        </table>

        <table class="calendar-input-month" :inert="mode === 'month' ? null : 'true'">
            <tbody>
                <tr v-for="months in [ [ null, 0, 1 ], [ 2, 3, 4 ], [ 5, 6, 7 ], [ 8, 9, 10 ], [ 11, null, null ] ]">
                    <template v-for="i in months">
                        <td v-if="i === null" class="disabled"></td>
                        <td v-else>
                            <button
                                type="button"
                                :title="monthData[i].name"
                                :style="{
                                '--local-colour': monthData[i].color,
                                '--local-pale': hexToRgba(monthData[i].color, .07),
                            }"
                                @click="setMonth(i)">

                                <span class="name">{{ monthData[i].short }}</span>
                                <span class="number">{{ (i + 1).toString().padStart(2, '0') }}</span>
                            </button>
                        </td>
                    </template>
                </tr>
            </tbody>
        </table>

        <table class="calendar-input-year" :inert="mode === 'year' ? null : 'true'">
            <tbody>
                <tr class="control-row"><td colspan="4">
                    <button type="button" @click="prev">прошлые 4 года</button>
                </td></tr>

                <tr v-for="i in 3" class="value-row">
                    <td
                        v-for="j in 4"
                        :class="{
                            today: today?.startsWith((selectorYear + i*4 + j - 5).toString()),
                            active: value_?.startsWith((selectorYear + i*4 + j - 5).toString()),
                        }">

                        <button type="button" @click="setYear(selectorYear + i*4 + j - 5)">
                            {{ selectorYear + i*4 + j - 5 }}
                        </button>
                    </td>
                </tr>

                <tr class="control-row"><td colspan="4">
                    <button type="button" @click="next">следующие 4 года</button>
                </td></tr>
            </tbody>
        </table>
    </section>
</template>


<script>
import { monthData, DateNames } from "~/plugins/assets"
import { normalizeDate, daysOn } from "~/plugins/scripts/time"
import { hexToRgba } from "~/plugins/scripts/utils"

export default {
    name: "Calendar",

    components: {
        Icon: () => import('~/components/utils/Icon')
    },

    props: {
        value: {
            type: String,
            default: null
        },

        /**  @type {'day' | 'month' | 'year'} */
        scope: {
            type: String,
            default: 'day'
        }
    },

    data () {
        let now = new Date

        return {
            year: now.getFullYear(),
            month: now.getMonth(),

            /** @type {'year' | 'month' | 'day'} */
            mode: this.scope,

            value_: this.value,
            today: now.toISOString().substring(0, 10),

            DateNames,
            monthData,
            selectorYear: now.getFullYear() - now.getFullYear() % 4 - 4,

            days: daysOn(now.getFullYear(), now.getMonth()),
            events: {}
        }
    },

    watch: {
        value_ () {
            this.$emit('input', this.value_ || '')
            this.$emit('update:modelValue', this.value_ || '')
        },
        value () {
            this.value_ = this.value
        }
    },

    methods: {
        hexToRgba,

        recalculateDays () {
            this.days = daysOn(this.year, this.month)
        },

        /** @param {number | string | Date | 'now'} date */
        select (date) {
            let d = normalizeDate(date === 'now' ? new Date : date)
            if (d) {
                this.value_ = d.toISOString().substring(0, 10)
                this.year = d.getFullYear()
                this.month = d.getMonth()
                this.recalculateDays()
            }
        },

        /** @param {number | string | Date | 'now'} date */
        open (date = 'now') {
            let d = normalizeDate(date === 'now' ? new Date : date)
            if (d) {
                this.year = d.getFullYear()
                this.month = d.getMonth()
                this.recalculateDays()
            }
        },

        /**
         * @param {number} year
         * @param {number} month - 0-11
         * @param {number} day - 1-31
         * @returns {string}
         */
        from (year, month, day) {
            return new Date(year, month, day, 12, 0, 0).toISOString().substring(0, 10)
        },

        /**
         * @param {string} date
         * @returns {number} - amount of events assigned on date
         */
        eventsOn (date) {
            return this.events[date]?.length ?? null
        },

        next () {
            switch (this.mode) {
                case 'year':
                    this.selectorYear += 4
                    return

                case 'month':
                    this.year ++
                    break

                case 'day':
                    if (this.month === 11) {
                        this.month = 0
                        this.year ++
                    }
                    else {
                        this.month ++
                    }
                    break
            }
            this.recalculateDays()
        },

        prev () {
            switch (this.mode) {
                case 'year':
                    this.selectorYear -= 4
                    return

                case 'month':
                    this.year --
                    break

                case 'day':
                    if (this.month === 0) {
                        this.month = 11
                        this.year --
                    }
                    else {
                        this.month --
                    }
                    break
            }
            this.recalculateDays()
        },

        choseMonth () {
            if (this.mode === 'month') this.mode = this.scope
            else this.mode = 'month'
        },

        setMonth (value) {
            this.month = value
            this.$emit('month', { month: this.month, year: this.year })
            this.mode = this.scope
            this.recalculateDays()
        },

        choseYear () {
            this.selectorYear = this.year - this.year % 4 - 4
            if (this.mode === 'year') this.mode = this.scope
            else this.mode = 'year'
        },

        setYear (value) {
            this.year = value
            this.$emit('year', { year: this.year })
            this.mode = 'month'
            this.recalculateDays()
        },
    }
}
</script>


<style scoped>
.calendar-input {
    width: 240px;
    min-width: 240px;
    max-width: 240px;
    position: relative;
}


.calendar-input-header {
    gap: 6px;
}
.calendar-input-header > button:first-child {
    width: 60px;
    min-width: 60px;
    max-width: 60px;
}
.calendar-input-header > button {
    color: #000 !important;
    text-align: left;
}
.calendar-input-header > .icon-button {
    padding: 4px;
}


.calendar-input-table {
    border-collapse: separate;
    border-spacing: 2px;
    transition: opacity .3s;
}

.calendar-input-table :is(td, th) {
    width: 32px;
    height: 32px;
    text-align: center;
    vertical-align: middle;
}

.calendar-input-table thead th {
    border-bottom: 1px solid #CCC;
}

.calendar-input-table .calendar-input-day-cell.events {
    position: relative;
}
.calendar-input-table .calendar-input-day-cell.events::after {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 666px;
    background: var(--company-back);
    pointer-events: none;
}

.calendar-input-table .calendar-input-day-cell > button {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: none;
    font-size: 16px;
    color: inherit;
    cursor: pointer;
}

.calendar-input-table .calendar-input-day-cell > button:focus {
    outline: 1px solid #000;
    outline-offset: 2px;
}


.calendar-input-month {
    position: absolute;
    top: 32px;
    left: 0;
    width: 240px;
    border-collapse: separate;
    border-spacing: 2px;
    table-layout: fixed;
    transition: visibility .3s, opacity .3s, transform .3s;
}

.calendar-input-month td {
    --rows: 5;
    height: calc((238px - 2px * var(--rows)) / var(--rows));
}
.calendar-input-month td > button {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 0;
    width: 100%;
    height: 100%;
    background: var(--local-pale);
    color: var(--local-colour);
}
.calendar-input-month td > button > .name {
    font-size: 110%;
    font-weight: bold;
}
.calendar-input-month td > button > .number {
    font-size: 90%;
}
.calendar-input-month td > button:hover { filter: brightness(.8) }
.calendar-input-month td > button:active { filter: brightness(.9) }


.calendar-input-year {
    position: absolute;
    top: 32px;
    left: 0;
    width: 240px;
    border-collapse: separate;
    border-spacing: 2px;
    table-layout: fixed;
    transition: visibility .3s, opacity .3s, transform .3s;
}
.calendar-input-year > tbody > .control-row > td {
    height: 35px;
}
.calendar-input-year > tbody > .value-row > td {
    height: 50px;
}
.calendar-input-year td > button {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 0;
    width: 100%;
    height: 100%;
    color: #000;
    padding: 0;
    border-radius: 0;
}
.calendar-input-year td > button:hover { background: #DDD; }
.calendar-input-year td > button:active { background: #CCC; }


.calendar-input td.active {
    background: var(--company-pale);
    outline: 2px solid var(--company-back);
    outline-offset: -1px;
}
.calendar-input td.today > button {
    color: var(--company-back);
    font-weight: bold;
}

.calendar-input td:not(.disabled):hover { background: #DDD !important; }
.calendar-input td:not(.disabled):active { background: #CCC !important; }


.calendar-input-table[inert] {
    opacity: 0;
}

.calendar-input-month[inert],
.calendar-input-year[inert] {
    opacity: 0;
    transform: translateY(-10px);
    visibility: hidden;
}
</style>
