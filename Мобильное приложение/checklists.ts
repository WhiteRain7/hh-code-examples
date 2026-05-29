import {
    type GeoPosition,
    type Facility,
    type Territory,
    type ConditionString,
    type TemplateField,
    type TemplatePolarField,
    type TemplateOptionsField,
    type TemplatePercentField,
    type TemplateListField,
    type TemplateBranchesField,
    type ChecklistTemplate,
    type ChecklistSimplifiedMeta,
    type ChecklistMeta,
    type ChecklistProgress,
    type ChecklistGroupProgress,
    type TemplateConfiguration,
    type ChecklistFieldExportData,
} from 'public/scripts/types'
import { TemplateManager } from "public/scripts/api"
import { Files, Storage } from "public/scripts/storage"
import { Geolocation } from "public/scripts/environment"
import { uuidv4 } from "public/scripts/utils"
import { debounce } from "lodash"


export class ChecklistField {
    protected checklist: Checklist

    public readonly id: number
    public readonly unique: string
    protected readonly group: number
    public readonly type: TemplateField['type']
    public readonly name: string

    public _value: null|string
    public _comment: string = ''

    protected readonly precondition?: ConditionString
    protected readonly allowedTypes?: number[]

    constructor (checklist: Checklist, field: TemplateField, group: number) {
        this.checklist = checklist

        this.id = field.id
        this.type = field.type
        this.name = field.name

        this._value = null
        this.group = group

        this.unique = `${this.checklist.uuid}/${this.group}-${this.id}`

        this.precondition = field.condition
        this.allowedTypes = field.facilityTypes?.map(t => t.id)
    }

    public get imageTemplate (): string {
        return `/checklists/${this.checklist.uuid}/${this.group}-${this.id}-{}.img`
    }

    public async imagesUploaded () : Promise<number> {
        let template = this.imageTemplate
        let uploaded : number = 0
        for (let i = 0; i < (this.checklist.configuration.criteriaPictures?.allowed ?? 3); i++) {
            uploaded += await Files.read(template.replace('{}', (i+1).toString())) ? 1 : 0
        }
        return uploaded
    }

    public get raw (): any { return this._value }
    public get value (): any { return this._value }

    public get comment (): string { return this._comment }
    public set comment (value: string) {
        this._comment = value
        this.checklist.debouncedSave()
    }

    public exists (): boolean { return true }
    public filled (): boolean { return this.value !== null }
    public satisfied (): boolean {
        if (
            this.allowedTypes?.length &&
            !this.allowedTypes.includes(this.checklist.facility?.facilityType?.id ?? -1)
        ) {
            return false
        }
        if (!this.precondition) return true
        return this.checklist.checkSatisfied(this.precondition, this.group)
    }

    public find (id: number): ChecklistField|null {
        if (this.id === id) return this
        else return null
    }

    public save (): any {
        return { v: this.value, c: this.comment }
    }
    public load (value: any): void {
        if (!value) {
            this._value = null
            this._comment = ''
        }
        else if (typeof value == 'object') {
            this._value = value.v
            this._comment = value.c
        }
        else {
            this._value = value
            this._comment = ''
        }
    }

    public progress (): { filled: number, total: number } {
        return this.satisfied() ?
            { filled: this.filled() ? 1 : 0, total: 1 } :
            { filled: 0, total: 0 }
    }

    public collect () : Array<ChecklistFieldExportData> { return [] }
}


export class ChecklistPolar extends ChecklistField {
    constructor (checklist: Checklist, field: TemplatePolarField, index: number) {
        super(checklist, field, index)
    }

    public override get value (): null|'да'|'нет' { return this._value as null|'да'|'нет' }

    public override set value (value: null|'да'|'нет') {
        if (value !== 'да' && value !== 'нет' && value !== null) return
        this._value = value
        this.checklist.debouncedSave()
    }

    public override collect () : Array<ChecklistFieldExportData> {
        return [{
            field: { id: this.id },
            isSelected: this.value === 'да',
            comment: this.comment
        }]
    }
}

export class ChecklistOptions extends ChecklistField {
    public readonly options: Array<{ id: number, name: string }>

    constructor (checklist: Checklist, field: TemplateOptionsField, index: number) {
        super(checklist, field, index)
        this.options = field.options ?? []
    }

    public override get value (): number | null { return this._value ? Number(this._value) : null }

    public override set value (value: number | null) {
        if (value !== null && !this.options.find(o => o.id == value)) return
        this._value = value ? value.toString() : null
        this.checklist.debouncedSave()
    }

    public override collect () : Array<ChecklistFieldExportData> {
        return [{
            field: { id: this.id },
            option: { id: this.value! },
            comment: this.comment
        }]
    }
}

export class ChecklistPercent extends ChecklistField {
    public readonly percents?: number[]
    public readonly options?: { value: string, len: number }[]
    public readonly emptyOption?: string

    constructor (checklist: Checklist, field: TemplatePercentField, index: number) {
        super(checklist, field, index)
        this.percents = field.percents?.length ? field.percents : undefined
        if (this.percents) {
            this.options = [
                { value: `0-${this.percents[0]*100}`, len: this.percents[0] }
            ]
            for (let i = 1; i < this.percents.length; i++) {
                this.options.push({
                    value: `${this.percents[i-1]*100}-${this.percents[i]*100}`,
                    len: this.percents[i] - this.percents[i-1]
                })
            }
            this.options.push({
                value: `${this.percents[this.percents.length-1]*100}-100`,
                len: 1 - this.percents[this.percents.length-1]
            })
        }
        this.emptyOption = field.emptyOption ?? 'значения не предусмотрено'
    }

    public override get value (): null|number|string {
        if (this._value === null) return null
        if (/\d{0-3}%/.test(this._value)) return Number(this._value.slice(0, -1))
        return this._value
    }

    public override set value (value: null|number|string) {
        if (value === null && this.emptyOption) {
            this._value = null
            this.checklist.debouncedSave()
        }
        else if (!this.percents?.length) {
            if (typeof value !== 'number') return
            if (value < 0) value = 0
            if (value > 100) value = 100
            this._value = value.toString()
            this.checklist.debouncedSave()
        }
        else if (typeof value === 'string') {
            this._value = value
            this.checklist.debouncedSave()
        }
    }

    public override filled (): boolean {
        if (this.value !== null) return true
        else return Boolean(this.emptyOption)
    }

    public override collect () : Array<ChecklistFieldExportData> {
        return [{
            field: { id: this.id },
            percent: this.value as any,
            comment: this.comment
        }]
    }
}

export class ChecklistList extends ChecklistField {
    public readonly children: ChecklistField[]

    constructor (checklist: Checklist, field: TemplateListField, index: number) {
        super(checklist, field, index)

        this.children = []

        for (const child of field.children || []) {
            switch (child.type) {
                case "polar"   : this.children.push(new ChecklistPolar   (checklist, child, index)); break
                case "options" : this.children.push(new ChecklistOptions (checklist, child, index)); break
                case "percent" : this.children.push(new ChecklistPercent (checklist, child, index)); break
                case "list"    : this.children.push(new ChecklistList    (checklist, child, index)); break
                case "branches": this.children.push(new ChecklistBranches(checklist, child, index)); break
                default: this.children.push(new ChecklistField(checklist, child, index))
            }
        }
    }

    public override filled (): boolean {
        for (const child of this.children) {
            if (child.satisfied() && !child.filled()) return false
        }
        return true
    }

    public override find (id: number): ChecklistField|null {
        for (const child of this.children) {
            const result = child.find(id)
            if (result) return result
        }
        return null
    }

    public override save (): any {
        let values: any = {}

        for (const child of this.children) {
            values[child.id] = child.save()
        }
        return values
    }

    public override load (value: any): void {
        if (!value) return

        for (const child of this.children) {
            child.load(value?.[child.id] || null)
        }
    }

    public override progress (): { filled: number, total: number } {
        let filled = 0
        let total = 0

        for (const child of this.children) {
            const progress = child.progress()
            filled += progress.filled
            total += progress.total
        }

        return { filled, total }
    }

    public override collect () : Array<ChecklistFieldExportData> {
        let result : ChecklistFieldExportData[] = []

        for (let child of this.children) {
            if (child.satisfied()) result.push(...child.collect())
        }

        return result
    }
}

interface Branch {
    index: number
    condition: ConditionString
    children: ChecklistField[]
    reason?: string // optional note why this branch
    isCumulative?: boolean // first satisfied non-cumulative alternative will be alone, otherwise all stacked
}
export class ChecklistBranches extends ChecklistField {
    private readonly branches: Branch[] = []
    public readonly placeholder?: string

    constructor (checklist: Checklist, field: TemplateBranchesField, index: number) {
        super(checklist, field, index)

        this.branches = []
        this.placeholder = field.placeholder

        let i = 0
        for (let branch of field.branches) {
            let local : Branch = {
                index: i ++,
                condition: branch.condition,
                children: [],
                reason: branch.reason,
                isCumulative: branch.isCumulative
            }

            for (const child of branch.children || []) {
                switch (child.type) {
                    case "polar"   : local.children.push(new ChecklistPolar   (checklist, child, index)); break
                    case "options" : local.children.push(new ChecklistOptions (checklist, child, index)); break
                    case "percent" : local.children.push(new ChecklistPercent (checklist, child, index)); break
                    case "list"    : local.children.push(new ChecklistList    (checklist, child, index)); break
                    case "branches": local.children.push(new ChecklistBranches(checklist, child, index)); break
                    default: local.children.push(new ChecklistField(checklist, child, index))
                }
            }

            this.branches.push(local)
        }
    }

    get activeBranches (): Branch[] {
        let branches: Branch[] = []

        for (let branch of this.branches) {
            if (this.checklist.checkSatisfied(branch.condition, this.group)) {
                if (!branch.isCumulative) return [ branch ]
                branches.push(branch)
            }
        }

        return branches
    }

    public override filled (): boolean {
        for (const branch of this.activeBranches) {
            for (const child of branch.children) {
                if (child.satisfied() && !child.filled()) return false
            }
        }
        return true
    }

    public override find (id: number): ChecklistField|null {
        for (const branch of this.activeBranches) {
            for (const child of branch.children) {
                const result = child.find(id)
                if (result) return result
            }
        }
        return null
    }

    public override save (): any {
        let values: any = {}

        for (let i = 0; i < this.branches.length; i++) {
            const branch = this.branches[i]

            values[i] = {}

            for (const child of branch.children) {
                values[i][child.id] = child.save()
            }
        }

        return values
    }

    public override load (value: any): void {
        for (let i = 0; i < this.branches.length; i++) {
            for (const child of this.branches[i].children) {
                child.load(value?.[i]?.[child.id] || null)
            }
        }
    }

    public override progress (): { filled: number, total: number } {
        let filled = 0
        let total = 0

        for (const branch of this.activeBranches) {
            for (const child of branch.children) {
                const progress = child.progress()
                filled += progress.filled
                total += progress.total
            }
        }

        return { filled, total }
    }

    public override collect () : Array<ChecklistFieldExportData> {
        let result : ChecklistFieldExportData[] = []

        for (const branch of this.activeBranches) {
            for (let child of branch.children) {
                if (child.satisfied()) result.push(...child.collect())
            }
        }

        return result
    }
}

// TODO optimize save calls and progress calculation through cache
export class Checklist {
    public uuid: string
    public createdAt: number
    public updatedAt: number

    private readonly template: ChecklistTemplate
    public readonly configuration: TemplateConfiguration
    public readonly name: string

    private _signed: boolean = false
    public sent: boolean = false
    public downloadId?: number

    public readonly info: {
        territoryBased: boolean
        direction?: string
        svg?: string
        facilityType?: any
        index?: string
        groupsCount?: number
    }

    private _territory?: Territory
    private _facility: Facility | null = null
    private _geo?: GeoPosition
    private _comment: string = ''

    public readonly groups: { name: string, note?: string, fields: ChecklistField[] }[]

    constructor (template: ChecklistTemplate) {
        this.uuid = uuidv4()
        this.createdAt = Date.now()
        this.updatedAt = this.createdAt

        this.template = template
        this.configuration = template.configuration
        this.name = `${template.commonDirection.priority}.${template.priority} ${template.name}`

        this.info = {
            territoryBased: template.territoryBased,
            direction: template.commonDirection.name,
            svg: template.commonDirection.svg,
            facilityType: template.facilityType,
            index: `${template.commonDirection.priority}.${template.priority}`,
            groupsCount: template.groups.length
        }

        this.groups = []

        let i = 0
        for (const group of template.groups) {
            const groupFields: ChecklistField[] = []

            for (const field of group.fields) {
                switch (field.type) {
                    case "polar"   : groupFields.push(new ChecklistPolar   (this, field, i)); break
                    case "options" : groupFields.push(new ChecklistOptions (this, field, i)); break
                    case "percent" : groupFields.push(new ChecklistPercent (this, field, i)); break
                    case "list"    : groupFields.push(new ChecklistList    (this, field, i)); break
                    case "branches": groupFields.push(new ChecklistBranches(this, field, i)); break
                    default: groupFields.push(new ChecklistField(this, field, i))
                }
            }

            this.groups.push({
                name: group.name,
                note: group.commentSurveyor,
                fields: groupFields
            })

            i ++
        }
    }

    public get criterionId () : number { return this.template.id }

    public get territory (): Territory { return this._territory ?? { id: -1, name: '' } as Territory }
    public set territory (value: Territory) { this._territory = value; this.debouncedSave() }

    public get facility (): Facility | null { return this._facility }
    public set facility (value: Facility | null) { this._facility = value; this.debouncedSave() }

    public get geo (): GeoPosition|undefined { return this._geo }
    public set geo (value: GeoPosition|undefined) { this._geo = value; this.debouncedSave() }

    public get comment (): string { return this._comment }
    public set comment (value: string) { this._comment = value; this.debouncedSave() }

    public get imageTemplate () : string {
        return `/checklists/${this.uuid}/common-{}.img`
    }

    public async imagesUploaded () : Promise<number> {
        let template = this.imageTemplate
        let uploaded : number = 0
        for (let i = 0; i < (this.configuration.commonPictures?.allowed ?? 3); i++) {
            uploaded += await Files.read(template.replace('{}', (i+1).toString())) ? 1 : 0
        }
        return uploaded
    }

    public async locate () {
        if (!this.configuration?.geolocationAllowed) return
        const geo = await Geolocation.get()
        if (!geo) return
        this.geo = geo
    }

    public checkSatisfied (condition: ConditionString, group: number): boolean {
        const searchGroup = this.groups[group]
        if (!searchGroup) return false

        const parsed = condition.replaceAll(
            /#(\d+)(\.\w+)?/g,
            (_: string, index: string, modifier?: string): string => {
                const i = parseInt(index)

                for (const field of searchGroup.fields) {
                    const found = field.find(i)

                    if (found) {
                        if (modifier) {
                            if (modifier === "exists") return found.exists().toString()
                            if (modifier === "filled") return found.filled().toString()
                            if (modifier === "satisfied") return found.satisfied().toString()
                            if (modifier === "raw") return found.raw?.toString() || 'null'
                        } else {
                            return found.value ? `"${found.value.toString()}"` : 'null'
                        }
                    }
                }

                return 'null'
            }
        )

        return evaluate(parsed)
    }

    public progress (): ChecklistProgress {
        let progress: ChecklistProgress['groups'] = []

        for (const index in this.groups) {
            const group = this.groups[index]

            let filled = 0
            let total = 0

            for (const field of group.fields) {
                const fp = field.progress()
                filled += fp.filled
                total += fp.total
            }

            progress.push({
                name: group.name,
                progress: total ? `${(filled / total * 100).toFixed(0)}%` : '-',
                filled,
                total
            })
        }

        const filled = progress.reduce((a, b) => a + b.filled, 0)
        const total = progress.reduce((a, b) => a + b.total, 0)

        return {
            name: this.name,
            progress: total ? `${(filled / total * 100).toFixed(0)}%` : '-',
            filled,
            total,
            groups: progress
        }
    }

    public progressOf (id: number): ChecklistGroupProgress {
        let progress: ChecklistGroupProgress['fields'] = []

        const group = this.groups[id]
        let filled = 0
        let total = 0

        for (const field of group.fields) {
            const fp = field.progress()
            filled += fp.filled
            total += fp.total

            progress.push({
                unique: field.unique,
                name: field.name,
                type: field.type,
                progress: total ? `${(filled / total * 100).toFixed(0)}%` : '-',
                filled: fp.filled,
                total: fp.total
            })
        }

        return {
            name: group.name,
            progress: total ? `${(filled / total * 100).toFixed(0)}%` : '-',
            filled,
            total,
            fields: progress
        }
    }

    public detailedProgress (): ChecklistGroupProgress[] {
        return this.groups.map((_, i) => this.progressOf(i))
    }

    public get filled () {
        if (!this._territory) return false
        if (!this.template.territoryBased && !this._facility) return false

        for (const group of this.groups) {
            for (const field of group.fields) {
                if (field.satisfied() && !field.filled()) return false
            }
        }

        return true
    }

    public async checkFilled () : Promise<boolean> {
        if (!this.filled) return false

        for (let i = 0; i < (this.configuration?.commonPictures?.required ?? 0); i++) {
            const file = await Files.read(
                `/checklists/${this.uuid}/common-${i+1}.img`,
                'base64',
                null
            )

            if (!file) return false
        }

        return true
    }

    public async sign (value: boolean = true) {
        if (!value) this._signed = false
        else if (await this.checkFilled()) this._signed = true
        await this.save()
    }
    public get signed () : boolean { return this._signed }

    public async save () {
        let values: any = {}

        values._tid = this.template.id
        values.territory = this._territory
        values.facility = this._facility
        values.geo = this._geo
        values.comment = this._comment

        let groupIndex = 0
        for (const group of this.groups) {
            for (const field of group.fields) {
                values[groupIndex + '/' + field.id] = field.save()
            }
            groupIndex ++
        }

        await ChecklistManager.save(this.template, this, values)
    }

    public debouncedSave = debounce(this.save.bind(this), 1000)

    public _load (values: Record<string, any>) {
        this._territory = values.territory
        this._facility = values.facility
        this._geo = values.geo
        this._comment = values.comment

        for (const groupIndex in this.groups) {
            const group = this.groups[groupIndex]

            for (const field of group.fields) {
                field.load(values?.[groupIndex + '/' + field.id] || null)
            }
        }
    }
    public collect () : Array<ChecklistFieldExportData> {
        let result : ChecklistFieldExportData[] = []

        for (let group of this.groups) {
            for (let child of group.fields) {
                if (child.satisfied()) result.push(...child.collect())
            }
        }

        return result
    }

    public async markSent () {
        await ChecklistManager.markSent(this.template, this)
    }
}


function count (target: any, within: any[]): number {
    return within.filter(arg => arg === target).length
}

/**
 * @example
 * any('value', [ 1, 'value', 3 ]) // true - expects at least 1 'value'
 * any(2, 'value', [ 1, 'value', 3 ]) // false - expects exactly 2 'value'
 * any(2, 'value', [ 'value', 'value' ]) // true
 *
 * @param args
 */
function any (...args: any[]): boolean {
    let quantity: number|undefined = args.length === 3 ? args[0] : undefined
    let target: any = args.at(-2)
    let within: any[] = args.at(-1)

    if (quantity) return count(target, within) === quantity
    else return count(target, within) > 0
}

/**
 * @example
 * all('value', [ 1, 'value', 3 ]) // false - expects all been 'value'
 * all('value', [ 'value', 'value' ]) // true
 *
 * @param target
 * @param args
 */
function all (target: any, args: any[]): boolean {
    return count(target, args) === args.length
}

function noLessThan (quantity: number, target: any, within: any[]): boolean {
    return count(target, within) >= quantity
}
function noMoreThan (quantity: number, target: any, within: any[]): boolean {
    return count(target, within) <= quantity
}
function lessThan (quantity: number, target: any, within: any[]): boolean {
    return !noMoreThan(quantity, target, within)
}
function moreThan (quantity: number, target: any, within: any[]): boolean {
    return !noLessThan(quantity, target, within)
}

function between (from: number, to: number, target: number): boolean {
    return target >= from && target <= to
}

function evaluate (script: string) : boolean {
    const scope = {
        any, all, noLessThan, noMoreThan, lessThan, moreThan, between,
        result: false,
    }

    for (const key in scope) {
        script = script.replaceAll(key + '(', 'this.' + key + '(')
    }

    Function(`"use strict"; this.result = ${script}`).bind(scope)()
    return scope.result
}


export class ChecklistManager {
    static async create (
        tid: number,
        values: { geo?: GeoPosition, territory: Territory, facility: Facility | null }
    ): Promise<string|null> {
        let template = await TemplateManager.get(tid)
        if (!template) return null
        let uuid = uuidv4()
        let createdAt = Date.now()
        let updatedAt = createdAt
        await ChecklistManager.save(
            template,
            {
                uuid,
                geo: values.geo,
                territory: values.territory,
                facility: values.facility,
                createdAt,
                updatedAt,
            } as Checklist,
            values
        )
        return uuid
    }

    static async newFromTemplateId (id: number): Promise<Checklist|null> {
        const template = await TemplateManager.get(id)
        if (!template) return null
        return ChecklistManager.compile(template)
    }

    static async compile (template: ChecklistTemplate): Promise<Checklist> {
        return new Checklist(template)
    }

    static async allMetas (): Promise<ChecklistMeta[]> {
        let metas: ChecklistMeta[] = []

        for (let key of Storage.keys()) {
            if (key.startsWith('CLM.')) {
                let meta = await Storage.read(key) as ChecklistSimplifiedMeta

                let pos = undefined

                if (meta.geo) {
                    const [ latitude, longitude ] = meta.geo.split(';').map(Number)
                    pos = { latitude, longitude }
                }

                metas.push({
                    uuid: key.substring(4),
                    createdAt: meta.cre,
                    updatedAt: meta.upd,
                    tid: meta.tid,
                    status: meta.sta,
                    name: meta.nam,
                    downloadId: meta.did,
                    subtitle: (
                        meta.sta === 'draft' ? 'черновик' :
                        meta.sta === 'filled' ? 'заполнено' :
                        meta.sta === 'sent' ? 'отправлено' : 'неизвестно'
                    ),
                    pos
                })
            }
        }

        return metas
    }

    static async allSorted (): Promise<{ draft: ChecklistMeta[], filled: ChecklistMeta[], sent: ChecklistMeta[] }> {
        const all : ChecklistMeta[] = await this.allMetas()
        let metas : { draft: ChecklistMeta[], filled: ChecklistMeta[], sent: ChecklistMeta[] } = {
            draft: [],
            filled: [],
            sent: []
        }

        for (let meta of all) {
            metas[meta.status as keyof typeof metas].push(meta)
        }

        return metas
    }

    static async save (template: ChecklistTemplate, checklist: Checklist, values: Record<string, any>) {
        await Files.write(`checklists/${checklist.uuid}/data.json`, values, 'json')

        checklist.updatedAt = Date.now()

        Storage.write('CLM.' + checklist.uuid, {
            cre: checklist.createdAt,
            upd: checklist.updatedAt,
            tid: template.id,
            did: checklist.downloadId,
            sta: checklist.sent ? 'sent' : checklist.signed ? 'filled' : 'draft',
            nam: checklist.facility?.name ?? template.name,
            geo: checklist.geo ? checklist.geo.latitude + ';' + checklist.geo.longitude : undefined,
        } as ChecklistSimplifiedMeta)
    }

    static async markSent (template: ChecklistTemplate, checklist: Checklist) {
        checklist.updatedAt = Date.now()
        checklist.sent = true

        Storage.write('CLM.' + checklist.uuid, {
            cre: checklist.createdAt,
            upd: checklist.updatedAt,
            tid: template.id,
            did: checklist.downloadId,
            sta: 'sent',
            nam: checklist.facility?.name ?? template.name,
            geo: checklist.geo ? checklist.geo.latitude + ';' + checklist.geo.longitude : undefined
        } as ChecklistSimplifiedMeta)
    }

    static async load (uuid: string): Promise<Checklist|null> {
        const meta = await Storage.read('CLM.' + uuid) as ChecklistSimplifiedMeta | null
        if (!meta) return null

        const values = await Files.read(`checklists/${uuid}/data.json`, 'json', null)
        if (!values) return null

        const template = await TemplateManager.get(meta.tid ?? values._tid)
        if (!template) return null

        let checklist = await ChecklistManager.compile(template)
        checklist._load(values)
        checklist.uuid = uuid
        checklist.createdAt = meta.cre
        checklist.updatedAt = meta.upd
        checklist.downloadId = meta.did
        if (meta.sta === 'filled') await checklist.sign(true)
        else if (meta.sta === 'sent') checklist.sent = true
        return checklist
    }

    static async delete (uuid: string): Promise<boolean> {
        let exists = await Files.read(`checklists/${uuid}/data.json`)

        if (!exists) return false

        await Files.rmdir('checklists/' + uuid)
        Storage.delete('CLM.' + uuid)

        return true
    }
}
