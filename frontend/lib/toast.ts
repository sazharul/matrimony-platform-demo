import Swal from 'sweetalert2';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

const SWAL_CONFIRM_COLOR = '#FFCF00';

interface ToastOptions {
    title?: string;
    message: string;
    type: AlertType;
    duration?: number;
}

/**
 * Show a toast notification at the top-right corner
 */
export const showToast = ({
    title,
    message,
    type,
    duration = 5000,
}: ToastOptions) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        width: 'auto',
        customClass: {
            popup: 'colored-toast',
        },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
    });

    const hasCustomTitle = Boolean(title?.trim());

    Toast.fire({
        icon: type,
        title: hasCustomTitle ? title!.trim() : message,
        text: hasCustomTitle ? message : undefined,
        timer: duration,
        timerProgressBar: true,
        showConfirmButton: false,
    });
};

/** Shared modal defaults for Holud-themed SweetAlert dialogs */
export const swalDefaults = {
    confirmButtonColor: SWAL_CONFIRM_COLOR,
    background: '#FFFFFF',
    color: '#1A1208',
    width: 'auto',
    padding: '1.25rem 1.5rem',
    customClass: {
        popup: 'rounded-2xl swal-modal-compact',
        title: 'text-[#1A1208] swal-modal-title',
        htmlContainer: 'text-[#5C4F3A] swal-modal-text',
        confirmButton: 'font-semibold',
    },
} as const;

/**
 * Show an error toast
 */
export const showErrorToast = (message: string, title?: string, duration?: number) => {
    showToast({
        type: 'error',
        title,
        message,
        duration: duration || 5000,
    });
};

/**
 * Show a success toast
 */
export const showSuccessToast = (message: string, title?: string, duration?: number) => {
    showToast({
        type: 'success',
        title,
        message,
        duration: duration || 3000,
    });
};

/**
 * Show an info toast
 */
export const showInfoToast = (message: string, title?: string, duration?: number) => {
    showToast({
        type: 'info',
        title,
        message,
        duration: duration || 4000,
    });
};

/**
 * Show a warning toast
 */
export const showWarningToast = (message: string, title?: string, duration?: number) => {
    showToast({
        type: 'warning',
        title,
        message,
        duration: duration || 4000,
    });
};

/**
 * Extract error message from API response
 */
export const getErrorMessage = (error: any): string => {
    // Handle axios error
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    // Handle generic error message
    if (error.message) {
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
};

