const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export const isBodyTooLarge = (
    request: Request,
    fileMaxBytes: number,
): boolean => {
    const length = Number(request.headers.get('content-length'));

    return (
        Number.isFinite(length) &&
        length > fileMaxBytes + MULTIPART_OVERHEAD_BYTES
    );
};
