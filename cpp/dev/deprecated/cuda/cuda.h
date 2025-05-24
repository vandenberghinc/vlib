/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
 
 DEPRECATED.
*/

// Header.
#ifndef VLIB_CUDA_H
#define VLIB_CUDA_H

// Include cuda.
#ifdef __NVCC__
#include <cuda.h>
#include <device_launch_parameters.h>
#include <cuda_gl_interop.h>
#include <cuda_runtime.h>
#endif

// Namespace vlib.
namespace vlib {

// Cuda API.
#ifdef __NVCC__
namespace cuda {

// Check errors.
void    check_err(const cudaError_t& code) {
    if (code != cudaSuccess) {
        throw CudaError("vlib::cuda::Array", cudaGetErrorString(code));
    }
}

// Peek last err.
void    peek_last_err() {
    check_err(cudaPeekAtLastError());
}

// Index of 1d thread.
__device__
int     index_1d() {
    return blockIdx.x * blockDim.x + threadIdx.x;
}

// Very simple cuda array object.
template <typename Type, int Dimension = 1, typename Length = ullong>
struct Array {
    
    // Attributes.
    Type*   m_arr = NULL;
    Length  m_rows;
    Length  m_cols;
    Length  m_pitch;
    
    // Default constructor.
    constexpr
    Array() = default;
    
    // Constructor with alloc.
    constexpr
    Array(const Length& rows) requires (Dimension == 1) {
        alloc(rows);
    }
    constexpr
    Array(const Length& rows, const Length& cols) requires (Dimension == 2) {
        alloc(rows, cols);
    }
    
    // Destructor.
    constexpr
    ~Array() {
        if (m_arr != NULL) {
            cudaFree(m_arr);
            m_arr = NULL;
        }
    }
    
    // Allocate.
    void    alloc(const Length& rows) requires (Dimension == 1) {
        m_rows = rows;
        check_err(cudaMalloc(&m_arr, rows * sizeof(Type)));
    }
    void    alloc(const Length& rows, const Length& cols) requires (Dimension == 2) {
        m_rows = rows;
        m_cols = cols;
        check_err(cudaMallocPitch(&m_arr, &m_pitch, m_cols * sizeof(Type), m_rows));
    }
    
    // Copy to device.
    void    to_device(const vlib::Array<Type>& host) requires (Dimension == 1) {
        check_err(cudaMemcpy(m_arr, host.data(), m_rows * sizeof(Type), cudaMemcpyHostToDevice));
    }
    void    to_device(const Type* host) requires (Dimension == 1) {
        check_err(cudaMemcpy(m_arr, host, m_rows * sizeof(Type), cudaMemcpyHostToDevice));
    }
    void    to_device(const Type* host) requires (Dimension == 2) {
        check_err(cudaMemcpy2D(
            m_arr,
            m_pitch,
            host,
            m_cols * sizeof(Type),
            m_cols * sizeof(Type),
            m_rows,
            cudaMemcpyHostToDevice
        ));
    }
    
    
    // Copy to host.
    void    to_host(vlib::Array<Type>& host) requires (Dimension == 1) {
        check_err(cudaMemcpy(host.data(), m_arr, m_rows * sizeof(Type), cudaMemcpyDeviceToHost));
    }
    void    to_host(Type* host) requires (Dimension == 1) {
        check_err(cudaMemcpy(host, m_arr, m_rows * sizeof(Type), cudaMemcpyDeviceToHost));
    }
    void    to_host(Type* host) requires (Dimension == 2) {
        check_err(cudaMemcpy2D(
            m_arr,
            m_pitch,
            host,
            m_cols * sizeof(Type),
            m_cols * sizeof(Type),
            m_rows,
            cudaMemcpyDeviceToHost
        ));
    }
    
    // Get data.
    constexpr
    auto&   data() { return m_arr; }
    constexpr
    auto&   data() const { return m_arr; }
    
    // Get rows.
    constexpr
    auto&   rows() { return m_rows; }
    
    // Get cols.
    constexpr
    auto&   cols() requires (Dimension == 2) { return m_rows; }
    
    // Index operator.
    constexpr
    auto&   operator[](const Length& index) { return m_arr[index]; }
    constexpr
    auto&   operator[](const Length& index) const { return m_arr[index]; }
    
};

};      // End namespace cuda.
#endif

}; 		// End namespace vlib.
#endif 	// End header.
