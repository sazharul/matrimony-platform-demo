import api from '@/lib/api';
import type {ApiResponse} from '@/types/user';

export type AccountDisableRequestType =
    | 'personal_reason'
    | 'got_married_through_platform';

export interface SubmitAccountDisableRequestPayload {
    request_type: AccountDisableRequestType;
    message: string;
}

export interface SubmitAccountDisableRequestResponse {
    id: number;
}

export const ACCOUNT_DISABLE_REQUEST_TYPES: {
    value: AccountDisableRequestType;
    label: string;
}[] = [
    {value: 'personal_reason', label: 'Personal Reason'},
    {value: 'got_married_through_platform', label: 'Got Married Through This Platform'},
];

export const accountDisableRequestService = {
    submit: (data: SubmitAccountDisableRequestPayload) =>
        api.post<ApiResponse<SubmitAccountDisableRequestResponse>>('/account-disable-requests', data),
};
